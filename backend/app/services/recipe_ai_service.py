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

GEMINI_MODEL_NAME = "gemini-2.5-flash"  # 1.5 flash는 안됨


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
당신은 요리 레시피를 추천하는 AI 셰프입니다.

[사용자가 현재 가지고 있는 주요 식재료]
{ingredients_str}

[내부 CSV 레시피 데이터 예시]
아래는 우리 서비스가 보유한 레시피 데이터베이스에서 추출한 예시입니다.
각 레시피는 '레시피 이름', '사용 재료', '조리 단계'로 구성되어 있습니다.
이 예시는 **스타일과 현실성 참고용**일 뿐, 그대로 복사하거나
거의 같은 조합을 다시 제안해서는 안 됩니다.

{context_text}

요청 사항(매우 중요):

1. 총 3개의 레시피를 JSON 배열 형태로 생성해 주세요.

2. 반드시 사용자가 보낸 재료 목록을 중심으로 레시피를 만드세요.
   - 각 레시피는 사용자 재료 중 최소 1개 이상을 반드시 포함해야 합니다.
   - 가능한 한, 전체 레시피들을 통틀어 사용자가 보낸 모든 재료가
     최소 한 번 이상은 등장하도록 해주세요.
   - 사용자 재료에 없는 주재료(예: 감자, 김치, 양파, 고기 등)를 새로 만들지 마세요.
     다만 기본 양념류(소금, 설탕, 간장, 식용유, 참기름, 후추, 물 등)는 예외로 허용합니다.

3. 이 3개 중:
   - 최소 1개는 **CSV에 없는 완전히 새로운 메뉴**여야 합니다.
     - 이 새로운 레시피는 CSV 예시의 레시피 이름과 겹치지 않아야 합니다.
     - CSV 예시의 주요 재료 조합을 그대로 베끼지 말고, 사용자가 보낸 재료를 중심으로
       새로운 아이디어의 요리를 만들어 주세요.
     - 이 새로운 레시피는 JSON 배열의 **마지막 요소**로 배치해 주세요.
   - 나머지 레시피들은 CSV 예시를 참고하여 비슷한 스타일이거나,
     레시피를 재구성/변형한 형태여도 괜찮습니다.
     (예: 재료 일부를 바꾸거나, 조리법을 단순화/응용하는 등)

4. 모든 레시피에서:
   - 가능한 한 사용자가 보낸 재료들을 중심으로 요리를 구성하세요.
   - 기본 양념류(소금, 설탕, 간장, 식용유, 참기름, 후추, 물 등)는 자유롭게 사용해도 됩니다.
   - 추가 재료를 넣을 수는 있지만, 사용자가 가진 재료를 무시하고 전혀 다른 메인 재료만으로 구성하지는 마세요.

5. 각 레시피는 다음 필드를 가진 JSON 객체여야 합니다:
   - "title": 레시피 이름 (문자열, 한국어)
   - "ingredients": 필요한 재료 리스트 (문자열 배열, 한국어. 필요하면 대략적인 분량도 함께 적어도 됩니다.)
   - "instructions": 조리 순서를 설명하는 한국어 텍스트.
       * 여러 단계를 쓸 경우, "1. ...\\n2. ...\\n3. ..." 처럼 줄바꿈은 반드시 "\\n"으로 표현하세요.
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


# ============================================================
# [정통 RAG 방식 템플릿 - 나중에 구현할 때 주석만 해제해서 사용]
# ============================================================

# from __future__ import annotations

# from typing import List
# from pathlib import Path
# import os
# import json

# import pandas as pd
# import google.generativeai as genai

# from app.schemas import RecipeSuggestion
# from app.vector_store import upsert_recipes, query_similar_recipes


# # =====================================
# # 0. Gemini 설정
# # =====================================

# GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
# if not GEMINI_API_KEY:
#     raise RuntimeError("GEMINI_API_KEY 환경변수가 설정되어 있지 않습니다.")

# genai.configure(api_key=GEMINI_API_KEY)

# # 네가 쓰고 있는 모델 ID 사용 (예: gemini-2.5-flash)
# GEMINI_MODEL_NAME = "gemini-2.5-flash"


# # =====================================
# # 1. CSV 로딩 (레시피 데이터)
# # =====================================

# DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "korean_recipes1.csv"

# if not DATA_PATH.exists():
#     raise FileNotFoundError(f"레시피 CSV 파일을 찾을 수 없습니다: {DATA_PATH}")


# def _load_csv(path: Path) -> pd.DataFrame:
#     for enc in ("utf-8", "cp949"):
#         try:
#             return pd.read_csv(path, encoding=enc)
#         except UnicodeDecodeError:
#             continue
#     return pd.read_csv(path)


# _df = _load_csv(DATA_PATH)

# # recipe_id 컬럼이 없을 수도 있으니 안전하게 처리
# if "recipe_id" not in _df.columns:
#     _df["recipe_id"] = _df.index


# # =====================================
# # 2. 벡터 DB 초기화 (정통 RAG: CSV → 벡터DB)
# # =====================================

def init_recipe_rag() -> None:
    return
#     """
#     앱 시작 시 한 번 호출해서:
#     - CSV 레시피 데이터를 벡터DB(Chroma)에 upsert.
#     """
#     docs = []
#     for _, row in _df.iterrows():
#         rid = row.get("recipe_id")
#         name = row.get("recipe_name", "")
#         ings = row.get("ingredients", "")
#         steps = row.get("steps", "")

#         text = f"레시피 이름: {name}\n재료: {ings}\n조리 단계: {steps}"

#         docs.append(
#             {
#                 "id": f"recipe_{rid}",
#                 "text": text,
#                 "meta": {
#                     "recipe_id": int(rid) if str(rid).isdigit() else str(rid),
#                     "recipe_name": name,
#                     "ingredients": ings,
#                     "steps": steps,
#                 },
#             }
#         )

#     upsert_recipes(docs)


# # =====================================
# # 3. 벡터DB에서 유사 레시피 검색 (정통 RAG retrieval)
# # =====================================

# def _retrieve_candidates_rag(
#     ingredients: List[str],
#     top_k: int = 5,
# ) -> pd.DataFrame:
#     """
#     벡터 DB(Chroma)를 사용해, 사용자 재료와 의미적으로 유사한 레시피 top_k개 검색.
#     """
#     if not ingredients:
#         return _df.head(top_k).copy()

#     query_text = "사용자 재료: " + ", ".join(ingredients)
#     results = query_similar_recipes(query_text, top_k=top_k)

#     if not results:
#         return _df.head(top_k).copy()

#     # 벡터DB 메타데이터에서 recipe_id를 가져와서 CSV와 매칭
#     ids = []
#     for r in results:
#         meta = r.get("metadata") or {}
#         rid = meta.get("recipe_id")
#         if rid is not None:
#             ids.append(rid)

#     if not ids:
#         return _df.head(top_k).copy()

#     # recipe_id 기준으로 필터링
#     candidates = _df[_df["recipe_id"].isin(ids)].copy()
#     if candidates.empty:
#         return _df.head(top_k).copy()

#     return candidates


# def _build_context_text(candidates: pd.DataFrame) -> str:
#     """
#     LLM에게 넘길 컨텍스트 텍스트 구성.
#     """
#     lines = []
#     for _, row in candidates.iterrows():
#         name = row.get("recipe_name", "")
#         ings = row.get("ingredients", "")
#         steps = row.get("steps", "")
#         lines.append(
#             f"- 레시피 이름: {name}\n"
#             f"  사용 재료: {ings}\n"
#             f"  조리 단계: {steps}\n"
#         )
#     return "\n".join(lines)


# # =====================================
# # 4. 메인 함수: FastAPI에서 사용하는 RAG + LLM 진입점
# # =====================================

# def suggest_recipes_from_ingredients(
#     ingredients: List[str],
#     num_suggestions: int = 3,
# ) -> List[RecipeSuggestion]:
#     """
#     [정통 RAG 파이프라인]
#     1) 사용자 재료 목록 → 쿼리 텍스트로 변환
#     2) 벡터DB(Chroma)에서 의미적으로 유사한 레시피 top_k 검색
#     3) 검색된 레시피들을 컨텍스트로 Gemini에 전달
#     4) CSV 레시피를 참고하되, 적어도 한 개는 완전히 새로운 메뉴를 포함하도록 프롬프트 설계
#     5) LLM 결과(JSON)를 RecipeSuggestion 리스트로 변환
#     """

#     # 1) RAG: 벡터DB에서 후보 레시피 검색
#     candidates = _retrieve_candidates_rag(ingredients, top_k=5)
#     context_text = _build_context_text(candidates)
#     ingredients_str = ", ".join(ingredients) if ingredients else "(재료 없음)"

#     # 2) Gemini 프롬프트 (한글, 정통 RAG 스타일)
#     model = genai.GenerativeModel(GEMINI_MODEL_NAME)

#     prompt = f"""
# 당신은 한국 요리 레시피를 추천하는 AI 셰프입니다.

# [사용자가 현재 가지고 있는 주요 식재료]
# {ingredients_str}

# [내부 레시피 데이터베이스에서 RAG로 검색된 레시피 예시]
# 아래 레시피들은 벡터 검색(RAG)을 통해, 사용자의 재료와 의미적으로 유사한 것들입니다.
# 각 레시피는 '레시피 이름', '사용 재료', '조리 단계'로 구성되어 있습니다.

# {context_text}

# 요청 사항:

# 1. 총 {num_suggestions}개의 레시피를 JSON 배열 형태로 생성해 주세요.

# 2. 이 {num_suggestions}개 중:
#    - 최소 1개는 **위 예시 레시피들에 없는 완전히 새로운 메뉴**여야 합니다.
#      - 이 새로운 레시피의 이름은 위 예시의 '레시피 이름'들과 겹치지 않아야 합니다.
#      - 예시 레시피의 재료 조합을 그대로 사용하지 말고, 사용자가 가진 재료를 중심으로
#        새로운 아이디어의 요리를 만드세요.
#      - 이 새로운 레시피는 JSON 배열의 **마지막 요소**로 배치해 주세요.
#    - 나머지 레시피들은 위 예시 레시피를 참고하여 비슷한 스타일이거나,
#      레시피를 재구성/변형한 형태여도 괜찮습니다.
#      (예: 재료 일부를 바꾸거나, 조리법을 단순화/응용하는 등)

# 3. 모든 레시피에서:
#    - 가능한 한 사용자가 보낸 재료들을 중심으로 요리를 구성하세요.
#    - 기본 양념류(소금, 설탕, 간장, 식용유, 참기름, 후추, 물 등)는 자유롭게 사용해도 됩니다.
#    - 추가 재료를 넣을 수는 있지만, 사용자가 가진 재료를 무시하고
#      전혀 다른 메인 재료만으로 구성하지는 마세요.

# 4. 각 레시피는 다음 필드를 가진 JSON 객체여야 합니다:
#    - "title": 레시피 이름 (문자열, 한국어)
#    - "ingredients": 필요한 재료 리스트 (문자열 배열, 한국어. 필요하다면 대략적인 분량도 함께 적어도 됩니다.)
#    - "instructions": 조리 순서를 설명하는 한국어 텍스트.
#        * 여러 단계를 쓸 경우, "1. ...\\n2. ...\\n3. ..." 처럼 줄바꿈은 반드시 "\\n"으로 표현하세요.
#    - "source_url": 문자열 또는 null (출처 URL이 없으면 null 로 설정)
#    - "image_url": 문자열 또는 null (예시 이미지 URL이 없으면 null 로 설정)
#    - "calories": 예상 열량 (실수, 대략적인 값이면 충분합니다. 예: 550.0)

# 출력 형식 (매우 중요):
# - 위 구조를 가진 객체들을 요소로 하는 **JSON 배열**만 출력하십시오.
# - JSON 바깥에 어떤 설명 문장이나 주석도 넣지 마십시오.
# - 예시:
# [
#   {{
#     "title": "...",
#     "ingredients": ["...", "..."],
#     "instructions": "1. ...\\n2. ...",
#     "source_url": null,
#     "image_url": null,
#     "calories": 500.0
#   }},
#   ...
# ]
#     """.strip()

#     response = model.generate_content(prompt)

#     # 3) LLM 응답 텍스트 추출
#     try:
#         text = response.text
#     except AttributeError:
#         text = response.candidates[0].content.parts[0].text

#     # 4) JSON 파싱
#     try:
#         data = json.loads(text)
#     except json.JSONDecodeError:
#         # 파싱 실패 시: RAG 후보 레시피를 간단히 fallback으로 사용
#         fallback: List[RecipeSuggestion] = []
#         for _, row in candidates.head(num_suggestions).iterrows():
#             fallback.append(
#                 RecipeSuggestion(
#                     title=row.get("recipe_name", "레시피"),
#                     ingredients=[
#                         x.strip() for x in str(row.get("ingredients", "")).split(",") if x.strip()
#                     ],
#                     instructions=row.get("steps", "조리 단계는 CSV 정보를 사용했습니다."),
#                     source_url=None,
#                     image_url=None,
#                     calories=0.0,
#                 )
#             )
#         return fallback

#     # 5) Pydantic 모델로 변환해서 반환
#     suggestions: List[RecipeSuggestion] = []
#     for item in data:
#         suggestions.append(
#             RecipeSuggestion(
#                 title=item.get("title"),
#                 ingredients=item.get("ingredients", []),
#                 instructions=item.get("instructions"),
#                 source_url=item.get("source_url"),
#                 image_url=item.get("image_url"),
#                 calories=float(item.get("calories") or 0.0),
#             )
#         )

#     return suggestions