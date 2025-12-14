# app/services/waste_ai_service.py

import os
import json
from pathlib import Path
from typing import List, Tuple, Dict

import google.generativeai as genai
from dotenv import load_dotenv

# -------------------------------------------------------------------
# 설정
# -------------------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parents[2]  # backend/
APP_DIR = BASE_DIR / "app"
DATA_PATH = APP_DIR / "data" / "waste_knowledge.json"

EMBED_MODEL = "text-embedding-004"
GEN_MODEL = "gemini-2.5-flash"

# 전역 변수
_WASTE_CHUNKS: List[Dict] = []
_GEN_MODEL = None
_GEMINI_API_KEY = None


# -------------------------------------------------------------------
# 1) 안전한 환경변수 로딩 (서버가 절대 죽지 않음)
# -------------------------------------------------------------------
def _load_env_and_model():
    global _GEN_MODEL, _GEMINI_API_KEY

    load_dotenv(BASE_DIR / ".env")
    _GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

    if not _GEMINI_API_KEY:
        print("⚠ WARNING: GEMINI_API_KEY 없음 → 분리수거 AI 기능 제한됨.")
        _GEN_MODEL = None
        return

    genai.configure(api_key=_GEMINI_API_KEY)
    _GEN_MODEL = genai.GenerativeModel(GEN_MODEL)


# -------------------------------------------------------------------
# 2) waste chunks 로딩 (파일 없으면 서버 안죽음)
# -------------------------------------------------------------------
def _load_waste_chunks():
    global _WASTE_CHUNKS

    if not DATA_PATH.exists():
        print(f"[WARN] {DATA_PATH} 파일이 없어 waste AI 기능 비활성화됨.")
        _WASTE_CHUNKS = []
        return

    try:
        with DATA_PATH.open("r", encoding="utf-8") as f:
            _WASTE_CHUNKS = json.load(f)
    except Exception as e:
        print(f"[WARN] waste_knowledge.json 읽기 실패: {e}")
        _WASTE_CHUNKS = []


# -------------------------------------------------------------------
# 모듈 import 시 초기화 (예외 발생해도 서버 안죽음)
# -------------------------------------------------------------------
try:
    if _GEN_MODEL is None:
        _load_env_and_model()

    if not _WASTE_CHUNKS:
        _load_waste_chunks()

except Exception as e:
    print(f"[WARN] waste AI 초기화 실패: {e}")
    print("[WARN] waste 기능 비활성화됨 (서버는 정상 작동)")
    _WASTE_CHUNKS = []
    _GEN_MODEL = None


# -------------------------------------------------------------------
# 3) 임베딩 (API KEY 없어도 zero-vector 반환)
# -------------------------------------------------------------------
def _embed_query(text: str) -> List[float]:
    if not _GEMINI_API_KEY:
        return [0.0] * 768  # fallback

    resp = genai.embed_content(
        model=EMBED_MODEL,
        content=text,
        task_type="retrieval_query",
    )
    return resp["embedding"]


# -------------------------------------------------------------------
# 4) 코사인 유사도 (numpy 없이)
# -------------------------------------------------------------------
def _cosine_similarity(a: List[float], b: List[float]) -> float:
    import math

    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(y * y for y in b))

    if na == 0.0 or nb == 0.0:
        return 0.0
    return dot / (na * nb)


# -------------------------------------------------------------------
# 5) 유사 chunk 검색
# -------------------------------------------------------------------
def _search_similar_chunks(question: str, top_k: int = 5) -> List[Dict]:
    q_emb = _embed_query(question)
    scored = [
        (_cosine_similarity(q_emb, ch["embedding"]), ch)
        for ch in _WASTE_CHUNKS
    ]
    scored.sort(key=lambda x: x[0], reverse=True)
    return [ch for sim, ch in scored[:top_k]]


# -------------------------------------------------------------------
# 6) 메인 함수 — AI 키 없어도 정상 동작
# -------------------------------------------------------------------
def answer_waste_question(question: str) -> Tuple[str, List[str]]:
    """
    분리수거 질문 처리.
    AI 모델/데이터 없으면 fallback 안내문만 반환.
    """

    # API KEY 없으면 fallback
    if not _GEMINI_API_KEY:
        return (
            "AI 분리배출 분석 기능을 사용할 수 없습니다.\n"
            "GEMINI_API_KEY가 설정되지 않았습니다.\n"
            "지자체의 공식 분리배출 지침을 참고해 주세요.",
            []
        )

    # 데이터 없으면 fallback
    if not _WASTE_CHUNKS:
        return (
            "공식 분리배출 문서 데이터가 없어 분석할 수 없습니다.\n"
            "관리자에게 waste_knowledge.json 파일 생성을 요청하세요.",
            []
        )

    # 정상 처리
    top_chunks = _search_similar_chunks(question, top_k=5)

    if not top_chunks:
        return (
            "등록된 공식 문서에서 관련 정보를 찾지 못했습니다.\n"
            "거주하시는 지자체의 생활폐기물 안내를 참고해주세요.",
            []
        )

    # 문맥 구성
    context_list = [
        f"[출처: {ch['source']}]\n{ch['text']}"
        for ch in top_chunks
    ]
    context_text = "\n\n-----\n\n".join(context_list)

    system_prompt = """
당신은 대한민국의 생활쓰레기 및 분리배출 규칙을 안내하는 전문 상담 AI입니다.
공식 문서를 기반으로 정확하고 안전하게 설명해 주세요.
"""

    user_prompt = f"""
[사용자 질문]
{question}

[공식 문서 요약]
{context_text}

위 정보를 기반으로:
1) 어떤 종류의 쓰레기인지
2) 어떻게 버려야 하는지
3) 주의사항
을 자세히 설명해 주세요.
"""

    full_prompt = system_prompt + "\n\n" + user_prompt

    # 모델 응답
    response = _GEN_MODEL.generate_content(full_prompt)
    try:
        answer = response.text.strip()
    except AttributeError:
        answer = response.candidates[0].content.parts[0].text.strip()

    sources = list({ch["source"] for ch in top_chunks})

    return answer, sources
