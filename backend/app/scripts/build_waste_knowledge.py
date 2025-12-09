# app/scripts/build_waste_knowledge.py

import os
import json
from pathlib import Path
from typing import List, Dict

from dotenv import load_dotenv
from pypdf import PdfReader
import google.generativeai as genai

# -------------------------------------------------------------------
# 설정
# -------------------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parents[2]  # backend/ 기준
APP_DIR = BASE_DIR / "app"
DATA_DIR = APP_DIR  / "data" / "waste_guides"
OUTPUT_PATH = APP_DIR  / "data" / "waste_knowledge.json"

EMBED_MODEL = "text-embedding-004"

# -------------------------------------------------------------------
# 유틸
# -------------------------------------------------------------------

def load_env():
    env_path = BASE_DIR / ".env"   # ✅ backend/.env
    load_dotenv(env_path)
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY가 .env에 설정되어 있지 않습니다.")
    genai.configure(api_key=api_key)


def read_pdf_text(pdf_path: Path) -> str:
    """PDF 전체 텍스트를 단일 문자열로 반환."""
    reader = PdfReader(str(pdf_path))
    texts: List[str] = []
    for page in reader.pages:
        text = page.extract_text() or ""
        texts.append(text)
    return "\n".join(texts)


def chunk_text(text: str, max_chars: int = 800, overlap: int = 100) -> List[str]:
    """
    긴 텍스트를 문장 단위는 아니지만, 대략적인 길이 기준으로 잘라냄.
    - max_chars: chunk 최대 길이
    - overlap: 인접 chunk 사이 겹치는 길이
    """
    text = text.strip()
    if not text:
        return []

    chunks: List[str] = []
    start = 0
    length = len(text)

    while start < length:
        end = min(start + max_chars, length)
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        start = end - overlap  # 조금 겹치게
        if start < 0:
            start = 0

    return chunks


def embed_text(text: str) -> List[float]:
    """Gemini 임베딩 생성."""
    resp = genai.embed_content(
        model=EMBED_MODEL,
        content=text,
        task_type="retrieval_document",
    )
    return resp["embedding"]


# -------------------------------------------------------------------
# 메인 로직
# -------------------------------------------------------------------

def build_waste_knowledge():
    load_env()

    if not DATA_DIR.exists():
        raise RuntimeError(f"{DATA_DIR} 디렉토리가 없습니다. PDF들을 여기에 넣어주세요.")

    all_entries: List[Dict] = []
    doc_id = 0

    for pdf_path in sorted(DATA_DIR.glob("*.pdf")):
        print(f"[*] PDF 읽는 중: {pdf_path.name}")
        full_text = read_pdf_text(pdf_path)
        chunks = chunk_text(full_text, max_chars=800, overlap=100)

        for i, chunk in enumerate(chunks):
            if not chunk.strip():
                continue

            embedding = embed_text(chunk)
            entry = {
                "id": f"{pdf_path.stem}-{i}",
                "source": pdf_path.name,
                "title": pdf_path.stem,
                "text": chunk,
                "embedding": embedding,
            }
            all_entries.append(entry)
            doc_id += 1

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_PATH.open("w", encoding="utf-8") as f:
        json.dump(all_entries, f, ensure_ascii=False, indent=2)

    print(f"완료! 총 {len(all_entries)}개의 청크를 {OUTPUT_PATH}에 저장했습니다.")


if __name__ == "__main__":
    build_waste_knowledge()
