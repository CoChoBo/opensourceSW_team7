# app/services/recipe_ai_service.py
from __future__ import annotations

from typing import List
from pathlib import Path
import os
import json

import pandas as pd
import google.generativeai as genai

from app.schemas import RecipeSuggestion


# =====================================
# 0. Gemini API 키 설정 (서버가 죽지 않도록 변경됨)
# =====================================

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# API 키가 있을 때만 Gemini 설정
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
else:
    print("⚠ WARNING: GEMINI_API_KEY가 설정되지 않음. 레시피 기능은 제한적으로 동작합니다.")

GEMINI_MODEL_NAME = "gemini-2.5-flash"


# =====================================
# 1. CSV 로딩 (RAG 기반 데이터)
# =====================================

DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "korean_recipes1.csv"

if not DATA_PATH.exists():
    raise FileNotFoundError(f"RAG용 CSV 파일을 찾을 수 없습니다: {DATA_PATH}")


def _load_csv(path: Path) -> pd.DataFrame:
    for enc in ("cp949", "utf-8"):
        try:
            return pd.read_csv(path, encoding=enc)
        except UnicodeDecodeError:
            continue
    return pd.read_csv(path)


_df = _load_csv(DATA_PATH)

_df["ingredients_list"] = (
    _df["ingredients"]
    .fillna("")
    .apply(lambda s: [x.strip() for x in str(s).split(",") if x.strip()])
)


# =====================================
# 2. RAG 후보 추출 로직
# =====================================

def _score_row(user_ings: List[str], row_ings: List[str]) -> int:
    u = set(i.strip().lower() for i in user_ings)
    r = set(i.strip().lower() for i in row_ings)
    return len(u & r)


def _retrieve_candidates(ingredients: List[str], top_k: int = 5) -> pd.DataFrame:
    if not ingredients:
        return _df.head(top_k).copy()

    scores = _df["ingredients_list"].apply(
        lambda row_ings: _score_row(ingredients, row_ings)
    )
    df_with_score = _df.copy()
    df_with_score["score"] = scores

    candidates = (
        df_with_score[df_with_score["score"] > 0]
        .sort_values("score", ascending=False)
        .head(top_k)
    )

    if candidates.empty:
        candidates = df_with_score.sort_values("score", ascending=False).head(top_k)

    return candidates


def _build_context_text(candidates: pd.DataFrame) -> str:
    lines = []
    for _, row in candidates.iterrows():
        name = row.get("recipe_name", "")
        ings = row.get("ingredients", "")
        steps = row.get("steps", "")
        lines.append(
            f"- 레시피 이름: {name}\n"
            f"  사용 재료: {ings}\n"
            f"  조리 단계: {steps}\n"
        )
    return "\n".join(lines)


# =====================================
# 3. 메인 레시피 추천 함수
#    (API 키 없어도 서버는 죽지 않음)
# =====================================

def suggest_recipes_from_ingredients(
    ingredients: List[str],
    num_suggestions: int = 3,
) -> List[RecipeSuggestion]:

    # -----------------------------
    # API 키 없으면 fallback 반환
    # -----------------------------
    if not GEMINI_API_KEY:
        return [
            RecipeSuggestion(
                title="레시피 기능 사용 불가",
                ingredients=ingredients,
                instructions="Gemini API Key가 설정되지 않아 레시피 추천 기능을 사용할 수 없습니다.",
                source_url=None,
                image_url=None,
                calories=0.0,
            )
        ]

    # -----------------------------
    # 정상 로직 (RAG → Gemini)
    # -----------------------------
    candidates = _retrieve_candidates(ingredients, top_k=5)
    context_text = _build_context_text(candidates)
    ingredients_str = ", ".join(ingredients) if ingredients else "(재료 없음)"

    model = genai.GenerativeModel(GEMINI_MODEL_NAME)

    prompt = f"""
당신은 요리 레시피를 추천하는 AI 셰프입니다.

[사용자 식재료]
{ingredients_str}

[참고용 CSV 레시피 데이터]
{context_text}

요청 조건:
1) 총 3개의 레시피를 JSON 배열 형태로 생성
2) 사용자가 가진 재료 기반으로 구성
3) 마지막 레시피는 반드시 '새로운 메뉴'
4) 각 객체는 title, ingredients, instructions, source_url, image_url, calories 필드를 포함
JSON 배열만 출력해 주세요.
""".strip()

    response = model.generate_content(prompt)

    # Gemini 응답 텍스트 추출
    try:
        text = response.text
    except AttributeError:
        text = response.candidates[0].content.parts[0].text

    # JSON 형태로 파싱
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        # Gemini 실패 시 fallback
        fallback: List[RecipeSuggestion] = []
        for _, row in candidates.head(num_suggestions).iterrows():
            fallback.append(
                RecipeSuggestion(
                    title=row.get("recipe_name", "레시피"),
                    ingredients=row.get("ingredients_list", []),
                    instructions=row.get("steps", "CSV 기반 조리 단계"),
                    source_url=None,
                    image_url=None,
                    calories=0.0,
                )
            )
        return fallback

    # Pydantic 형태로 변환
    suggestions: List[RecipeSuggestion] = []
    for item in data:
        suggestions.append(
            RecipeSuggestion(
                title=item.get("title"),
                ingredients=item.get("ingredients", []),
                instructions=item.get("instructions"),
                source_url=item.get("source_url"),
                image_url=item.get("image_url"),
                calories=float(item.get("calories") or 0.0),
            )
        )

    return suggestions


# =====================================
# RAG 초기화 (필요 없음, 빈 함수로 유지)
# =====================================
def init_recipe_rag() -> None:
    return
