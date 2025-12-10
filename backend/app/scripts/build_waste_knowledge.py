# app/scripts/build_waste_knowledge.py

import os
import json
import time
from pathlib import Path
from typing import List, Dict, Iterator

from dotenv import load_dotenv
from pypdf import PdfReader
import google.generativeai as genai

# -------------------------------------------------------------------
# 경로 설정
# -------------------------------------------------------------------

# backend/ 경로
BASE_DIR = Path(__file__).resolve().parents[2]

# backend/app/ 경로
APP_DIR = BASE_DIR / "app"

# PDF들이 들어있는 폴더: backend/app/data/waste_guides
DATA_DIR = APP_DIR / "data" / "waste_guides"

# 출력 파일: backend/app/data/waste_knowledge.json
OUTPUT_PATH = APP_DIR / "data" / "waste_knowledge.json"
TMP_OUTPUT_PATH = APP_DIR / "data" / "waste_knowledge.tmp.json"  # 임베딩 저장용

EMBED_MODEL = "text-embedding-004"

MAX_TOTAL_CHARS_DOC = 70000 # 문서 전체에서 최대 사용할 문자 수
# -------------------------------------------------------------------
# 환경 변수 & Gemini 설정
# -------------------------------------------------------------------

def load_env_and_configure():
    """
    backend/.env에서 GEMINI_API_KEY를 로드하고 Gemini SDK를 초기화한다.
    """
    env_path = BASE_DIR / ".env"  # backend/.env
    load_dotenv(env_path)

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError(f"GEMINI_API_KEY가 {env_path}에 설정되어 있지 않습니다.")

    genai.configure(api_key=api_key)


# -------------------------------------------------------------------
# PDF → 텍스트
# -------------------------------------------------------------------

def read_pdf_text(pdf_path: Path) -> str:
    """
    PDF 전체 텍스트를 문자열로 반환.
    너무 긴 문서는 MAX_TOTAL_CHARS_DOC 기준으로 앞부분만 사용.
    """
    reader = PdfReader(str(pdf_path))
    texts: List[str] = []
    char_count = 0

    for page in reader.pages:
        text = page.extract_text() or ""
        text = text.strip()
        if not text:
            continue

        remaining = MAX_TOTAL_CHARS_DOC - char_count
        if remaining <= 0:
            break

        if len(text) > remaining:
            text = text[:remaining]

        texts.append(text)
        char_count += len(text)

        if char_count >= MAX_TOTAL_CHARS_DOC:
            break

    full_text = "\n".join(texts)
    return full_text


def iter_chunks(
    text: str,
    max_chars: int = 500,
    overlap: int = 100,
) -> Iterator[str]:
    """
    긴 텍스트를 적당한 길이로 잘라 하나씩 yield 한다.
    리스트로 모으지 않으므로 메모리 사용이 매우 적다.
    """
    text = text.strip()
    if not text:
        return

    length = len(text)
    start = 0

    while start < length:
        end = min(start + max_chars, length)
        chunk = text[start:end].strip()
        if chunk:
            yield chunk
        # 다음 chunk 시작은 약간 겹치게
        start = end - overlap
        if start < 0:
            start = 0


# -------------------------------------------------------------------
# 임베딩
# -------------------------------------------------------------------

def embed_text(text: str) -> List[float]:
    """Gemini 임베딩 생성."""
    resp = genai.embed_content(
        model=EMBED_MODEL,
        content=text,
        task_type="retrieval_document",
    )
    return resp["embedding"]


# -------------------------------------------------------------------
# 체크포인트 로드/저장
# -------------------------------------------------------------------

def load_existing_entries() -> Dict[str, Dict]:
    """
    이미 생성된 waste_knowledge.json이 있으면 로드해서
    id -> entry 딕셔너리로 반환.
    """
    if not OUTPUT_PATH.exists():
        return {}

    with OUTPUT_PATH.open("r", encoding="utf-8") as f:
        data = json.load(f)

    existing = {entry["id"]: entry for entry in data}
    return existing


def save_entries(entries: Dict[str, Dict]):
    """
    entries 딕셔너리를 waste_knowledge.json으로 저장.
    TMP 파일에 먼저 쓰고 rename해서 파일 깨짐 방지.
    """
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    data_list = list(entries.values())

    with TMP_OUTPUT_PATH.open("w", encoding="utf-8") as f:
        json.dump(data_list, f, ensure_ascii=False, indent=2)

    TMP_OUTPUT_PATH.replace(OUTPUT_PATH)


# -------------------------------------------------------------------
# 메인 빌드 함수 (체크포인트 + 재시작 지원)
# -------------------------------------------------------------------

def build_waste_knowledge(checkpoint_every: int = 20, sleep_sec: float = 0.1):
    """
    PDF → 텍스트 → chunk → 임베딩 → JSON 저장
    - checkpoint_every: 몇 개 chunk마다 한 번씩 중간 저장할지
    - sleep_sec: 각 임베딩 호출 사이에 잠깐 쉼 (과부하 방지)
    """
    load_env_and_configure()

    if not DATA_DIR.exists():
        raise RuntimeError(f"{DATA_DIR} 디렉토리가 없습니다. PDF들을 여기에 넣어주세요.")

    # 이미 존재하는 엔트리 로드 (재시작 시 이어하기용)
    existing_entries = load_existing_entries()
    existing_ids = set(existing_entries.keys())

    print(f"[INFO] 기존 엔트리 수: {len(existing_entries)}")

    processed_count = 0
    new_count = 0

    pdf_paths = sorted(DATA_DIR.glob("*.pdf"))
    if not pdf_paths:
        raise RuntimeError(f"{DATA_DIR} 안에 PDF 파일이 없습니다.")

    for pdf_path in pdf_paths:
        print(f"\n[*] PDF 처리 시작: {pdf_path.name}")
        full_text = read_pdf_text(pdf_path)

        if not full_text.strip():
            print(f"    - 텍스트를 추출하지 못해 스킵합니다: {pdf_path.name}")
            continue

        chunk_counter_for_pdf = 0

        # ❗ 여기서 리스트 대신 generator 사용 → 메모리 고정
        for i, chunk in enumerate(iter_chunks(full_text, max_chars=500, overlap=100)):
            chunk_id = f"{pdf_path.stem}-{i}"

            # 이미 처리된 id이면 스킵 (재실행 이어하기)
            if chunk_id in existing_ids:
                continue

            if not chunk.strip():
                continue

            # 임베딩 생성
            try:
                embedding = embed_text(chunk)
            except Exception as e:
                print(f"[WARN] 임베딩 실패 (id={chunk_id}): {e}")
                continue

            entry = {
                "id": chunk_id,
                "source": pdf_path.name,
                "title": pdf_path.stem,
                "text": chunk,
                "embedding": embedding,
            }

            existing_entries[chunk_id] = entry
            existing_ids.add(chunk_id)
            new_count += 1
            processed_count += 1
            chunk_counter_for_pdf += 1

            # 약간 쉼 (노트북/데스크탑 과부하 방지)
            if sleep_sec > 0:
                time.sleep(sleep_sec)

            # 체크포인트 저장
            if processed_count % checkpoint_every == 0:
                print(f"    - 체크포인트 저장 중... (총 {len(existing_entries)}개)")
                save_entries(existing_entries)

        print(f"    - 처리된 청크 수: {chunk_counter_for_pdf}")
        print(f"[*] PDF 처리 완료: {pdf_path.name} (누적 엔트리: {len(existing_entries)})")
        save_entries(existing_entries)

    print("\n[완료] 새로 생성된 청크 수:", new_count)
    print("[완료] 전체 청크 수:", len(existing_entries))
    print(f"[INFO] 최종 파일: {OUTPUT_PATH}")


if __name__ == "__main__":
    # 필요하면 checkpoint_every, sleep_sec 조절 가능
    build_waste_knowledge(checkpoint_every=20, sleep_sec=0.1)
