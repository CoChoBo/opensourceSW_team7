# app/vector_store.py
from __future__ import annotations

from typing import List, Dict, Any
from pathlib import Path

import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer


# =====================================
# 0. Chroma 클라이언트 & 컬렉션 설정
# =====================================

BASE_DIR = Path(__file__).resolve().parent.parent
PERSIST_DIR = BASE_DIR / "chroma_data"

_client = chromadb.Client(
    Settings(
        chroma_db_impl="duckdb+parquet",
        persist_directory=str(PERSIST_DIR),
    )
)

_collection = _client.get_or_create_collection(name="recipes")


# =====================================
# 1. 임베딩 모델 (한국어 지원)
# =====================================

_EMBED_MODEL_NAME = "jhgan/ko-sroberta-multitask"
_embed_model: SentenceTransformer | None = None


def get_embed_model() -> SentenceTransformer:
    """
    SentenceTransformer 모델을 lazy하게 한 번만 로딩.
    """
    global _embed_model
    if _embed_model is None:
        _embed_model = SentenceTransformer(_EMBED_MODEL_NAME)
    return _embed_model


# =====================================
# 2. 레시피 문서 upsert
# =====================================

def upsert_recipes(docs: List[Dict[str, Any]]) -> None:
    """
    docs 예시:
    [
      {
        "id": "recipe_1",
        "text": "레시피 이름: ... 재료: ... 조리 단계: ...",
        "meta": {"recipe_id": 1, "recipe_name": "...", ...}
      },
      ...
    ]
    """
    if not docs:
        return

    model = get_embed_model()
    texts = [d["text"] for d in docs]
    ids = [d["id"] for d in docs]
    metadatas = [d.get("meta", {}) for d in docs]

    embeddings = model.encode(texts).tolist()  # List[List[float]]

    _collection.upsert(
        ids=ids,
        embeddings=embeddings,
        metadatas=metadatas,
        documents=texts,
    )

    _client.persist()


# =====================================
# 3. 유사 레시피 검색
# =====================================

def query_similar_recipes(query: str, top_k: int = 5) -> List[Dict[str, Any]]:
    """
    query: "사용자 재료: 사과, 어묵" 같은 문자열.

    반환 형식:
    [
      {
        "id": "...",
        "score": float,             # Chroma distance (작을수록 유사)
        "metadata": {...},
        "document": "텍스트..."
      },
      ...
    ]
    """
    model = get_embed_model()
    q_emb = model.encode([query]).tolist()[0]

    res = _collection.query(
        query_embeddings=[q_emb],
        n_results=top_k,
    )

    out: List[Dict[str, Any]] = []
    if not res["ids"]:
        return out

    ids = res["ids"][0]
    distances = res.get("distances", [[0.0] * len(ids)])[0]
    metadatas = res.get("metadatas", [[{}] * len(ids)])[0]
    docs = res.get("documents", [[None] * len(ids)])[0]

    for i in range(len(ids)):
        out.append(
            {
                "id": ids[i],
                "score": distances[i],
                "metadata": metadatas[i],
                "document": docs[i],
            }
        )
    return out
