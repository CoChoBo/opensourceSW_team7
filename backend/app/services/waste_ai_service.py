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
DATA_PATH = BASE_DIR / "data" / "waste_knowledge.json"

EMBED_MODEL = "text-embedding-004"
GEN_MODEL = "gemini-2.5-flash"  # 현재 잘 되는 모델 이름으로 사용

# 모듈 import 시 한 번만 로딩
_WASTE_CHUNKS: List[Dict] = []
_GEN_MODEL = None


def _load_env_and_model():
    global _GEN_MODEL
    load_dotenv(BASE_DIR / ".env")
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY 환경변수가 설정되어 있지 않습니다.")
    genai.configure(api_key=api_key)
    _GEN_MODEL = genai.GenerativeModel(GEN_MODEL)


def _load_waste_chunks():
    global _WASTE_CHUNKS
    if not DATA_PATH.exists():
        raise RuntimeError(
            f"{DATA_PATH} 파일이 없습니다. 먼저 build_waste_knowledge 스크립트를 실행해서 생성해 주세요."
        )
    with DATA_PATH.open("r", encoding="utf-8") as f:
        _WASTE_CHUNKS = json.load(f)


# 모듈 로딩 시 초기화
if _GEN_MODEL is None:
    _load_env_and_model()
if not _WASTE_CHUNKS:
    _load_waste_chunks()


# -------------------------------------------------------------------
# 벡터 계산 유틸
# -------------------------------------------------------------------

def _embed_query(text: str) -> List[float]:
    resp = genai.embed_content(
        model=EMBED_MODEL,
        content=text,
        task_type="retrieval_query",
    )
    return resp["embedding"]


def _cosine_similarity(a: List[float], b: List[float]) -> float:
    # numpy 없이 코사인 유사도 계산
    import math

    dot = 0.0
    na = 0.0
    nb = 0.0
    for x, y in zip(a, b):
        dot += x * y
        na += x * x
        nb += y * y
    if na == 0.0 or nb == 0.0:
        return 0.0
    return dot / (math.sqrt(na) * math.sqrt(nb))


def _search_similar_chunks(question: str, top_k: int = 5) -> List[Dict]:
    q_emb = _embed_query(question)
    scored = []
    for ch in _WASTE_CHUNKS:
        sim = _cosine_similarity(q_emb, ch["embedding"])
        scored.append((sim, ch))
    scored.sort(key=lambda x: x[0], reverse=True)
    return [ch for sim, ch in scored[:top_k]]


# -------------------------------------------------------------------
# 메인 함수
# -------------------------------------------------------------------

def answer_waste_question(question: str) -> Tuple[str, List[str]]:
    """
    사용자의 질문을 받아:
    1) 벡터 검색으로 관련 청크 찾고
    2) 해당 내용을 컨텍스트로 Gemini에 질의
    3) 한국어 답변 + 사용된 출처 목록 반환
    """
    top_chunks = _search_similar_chunks(question, top_k=5)
    if not top_chunks:
        answer = (
            "죄송하지만 현재 등록된 분리배출·음식물 쓰레기 지침 문서에서 "
            "관련 정보를 찾지 못했습니다. 거주하시는 지자체 홈페이지의 "
            "생활폐기물 안내 메뉴를 참고해 주세요."
        )
        return answer, []

    context_blocks = []
    for ch in top_chunks:
        block = f"[출처: {ch['source']}]\n{ch['text']}"
        context_blocks.append(block)

    context_text = "\n\n-----\n\n".join(context_blocks)

    system_prompt = """
당신은 대한민국의 생활쓰레기 분리배출 및 음식물류 폐기물 배출 방법을 안내하는
전문 상담 챗봇입니다.

아래 [지침 문서 발췌]는 환경부, 지자체 가이드라인 등 공식 자료에서 가져온 내용입니다.
- 반드시 이 자료를 최우선으로 참고하여 답변하세요.
- 한국의 일반적인 배출 규정(종량제 봉투, 음식물 전용봉투, 재활용 수거함 등)을 기준으로 설명합니다.
- 안전과 위생, 악취·해충 방지 관점의 주의사항도 함께 알려주세요.
- 질문이 모호하면, 합리적인 가정을 밝힌 뒤 답변하세요.
- 문서에 정보가 없거나 지역별로 차이가 큰 경우에는
  "문서에 없는 정보"임을 분명히 밝히고,
  구체적인 규정은 각 지자체 청소행정과/홈페이지 확인을 안내합니다.
- 반드시 존댓말(해요체)로, 단계별로 차분하게 설명해 주세요.
"""

    user_prompt = f"""
[사용자 질문]
{question}

[지침 문서 발췌(요약용 컨텍스트)]
{context_text}

위 자료를 기반으로, 사용자가 바로 따라 할 수 있도록
1) 어떤 종류의 쓰레기로 분류되는지
2) 실제로 어떻게 버려야 하는지 (예: 음식물 전용 봉투, 일반 종량제 봉투, 재활용 등)
3) 추가로 주의할 점
을 순서대로 설명해 주세요.
"""

    response = _GEN_MODEL.generate_content(
        [
            {"role": "system", "parts": [system_prompt]},
            {"role": "user", "parts": [user_prompt]},
        ]
    )

    answer = response.text.strip()
    sources = list({ch["source"] for ch in top_chunks})

    return answer, sources
