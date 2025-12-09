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
# 0. Gemini 설정
# =====================================

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY 환경변수가 설정되어 있지 않습니다.")

genai.configure(api_key=GEMINI_API_KEY)

GEMINI_MODEL_NAME = "gemini-1.5-flash"  # 필요하면 다른 모델로 교체 가능


# =====================================
# 1. CSV 로딩 (RAG용)
#    korean_recipes1.csv 구조:
#    recipe_id, recipe_name, ingredients, steps
# =====================================

DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "korean_recipes1.csv"

if not DATA_PATH.exists():
    raise FileNotFoundError(f"RAG용 CSV 파일을 찾을 수 없습니다: {DATA_PATH}")

# 한글 CSV는 보통 cp949/utf-8 섞여 있으니 둘 다 시도
def _load_csv(path: Path) -> pd.DataFrame:
    for enc in ("cp949", "utf-8"):
        try:
            return pd.read_csv(path, encoding=enc)
        except UnicodeDecodeError:
            continue
    # 둘 다 실패하면 그냥 기본 설정으로 시도
    return pd.read_csv(path)

_df = _load_csv(DATA_PATH)

# ingredients: "감자,양파,대파,..." → 리스트로 변환
_df["ingredients_list"] = (
    _df["ingredients"]
    .fillna("")
    .apply(lambda s: [x.strip() for x in str(s).split(",") if x.strip()])
)


def _score_row(user_ings: List[str], row_ings: List[str]) -> int:
    """
    유저 재료와 레시피 재료의 겹치는 개수로 간단하게 점수 계산.
    """
    u = set(i.strip().lower() for i in user_ings)
    r = set(i.strip().lower() for i in row_ings)
    return len(u & r)


def _retrieve_candidates(ingredients: List[str], top_k: int = 5) -> pd.DataFrame:
    """
    CSV에서 사용자 재료와 가장 많이 겹치는 레시피 top_k개 추출.
    """
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
    """
    Gemini에게 줄 컨텍스트 문자열 (한글) 생성.
    """
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
# 2. 메인 함수: FastAPI에서 사용하는 진입점
# =====================================

def suggest_recipes_from_ingredients(
    ingredients: List[str],
    num_suggestions: int = 3,
) -> List[RecipeSuggestion]:
    """
    냉장고에 있는 식재료 리스트를 받아,
    1) CSV에서 비슷한 레시피를 검색(RAG)
    2) 그 내용을 컨텍스트로 Gemini에게 한글 프롬프트를 보내
    3) RecipeSuggestion 리스트를 생성해 반환한다.
    """

    # 1) RAG: CSV에서 후보 레시피 가져오기
    candidates = _retrieve_candidates(ingredients, top_k=5)
    context_text = _build_context_text(candidates)

    ingredients_str = ", ".join(ingredients) if ingredients else "(재료 없음)"

    # 2) Gemini 프롬프트 (한글)
    model = genai.GenerativeModel(GEMINI_MODEL_NAME)

    prompt = f"""
당신은 한국 요리 레시피를 추천하는 AI 셰프입니다.

[사용자가 현재 가지고 있는 주요 식재료]
{ingredients_str}

[내부 CSV 레시피 데이터 예시]
아래는 우리 서비스가 보유한 레시피 데이터베이스에서 추출한 예시입니다.
각 레시피는 '레시피 이름', '사용 재료', '조리 단계'로 구성되어 있습니다.

{context_text}

요청 사항:
1. 위 CSV 레시피들을 그대로 복사하지 말고, 아이디어와 재료 조합만 참고해서
   사용자의 재료를 최대한 활용하는 새로운 레시피를 {num_suggestions}개 제안해 주세요.
2. 가능하면 한국 가정식/한식 스타일을 유지해 주세요.
3. 사용자는 기본적인 양념(소금, 설탕, 간장, 식용유, 후추 등)은 가지고 있다고 가정해도 됩니다.
4. 각 레시피는 다음 필드를 가진 JSON 객체여야 합니다:
   - "title": 레시피 이름 (문자열, 한국어)
   - "ingredients": 필요한 재료 리스트 (문자열 배열, 한국어. 필요하면 대략적인 분량도 함께 적어도 됩니다.)
   - "instructions": 조리 순서를 설명하는 한국어 텍스트 (간단한 단계 위주, 번호 목록 형태여도 괜찮습니다.)
   - "source_url": 문자열 또는 null (출처 URL이 없으면 null 로 설정)
   - "image_url": 문자열 또는 null (예시 이미지 URL이 없으면 null 로 설정)
   - "calories": 예상 열량 (실수, 대략적인 값이면 충분합니다. 예: 550.0)

출력 형식:
- 위 구조를 가진 객체들을 요소로 하는 **JSON 배열**만 출력하십시오.
- JSON 바깥에 어떤 설명 문장이나 주석도 넣지 마십시오.
- 예시:
[
  {{
    "title": "...",
    "ingredients": ["...", "..."],
    "instructions": "...",
    "source_url": null,
    "image_url": null,
    "calories": 500.0
  }},
  ...
]
    """.strip()

    response = model.generate_content(prompt)

    # 3) 텍스트 추출
    try:
        text = response.text
    except AttributeError:
        # 라이브러리 버전에 따른 예외적인 경우 대비
        text = response.candidates[0].content.parts[0].text

    # 4) JSON 파싱 (실패 시 fallback)
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        # 파싱 실패하면 CSV 후보 레시피를 간단히 Pydantic으로 변환해서 반환
        fallback: List[RecipeSuggestion] = []
        for _, row in candidates.head(num_suggestions).iterrows():
            fallback.append(
                RecipeSuggestion(
                    title=row.get("recipe_name", "레시피"),
                    ingredients=row.get("ingredients_list", []),
                    instructions=row.get("steps", "조리 단계는 CSV 정보를 사용했습니다."),
                    source_url=None,
                    image_url=None,
                    calories=0.0,
                )
            )
        return fallback

    # 5) Pydantic 모델로 변환해서 반환
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
