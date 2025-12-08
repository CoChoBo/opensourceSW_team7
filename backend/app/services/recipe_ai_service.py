# app/services/recipe_ai_service.py
from typing import List
from app.schemas import RecipeSuggestion

def suggest_recipes_from_ingredients(ingredients: List[str]) -> List[RecipeSuggestion]:
    """
    냉장고에 있는 식재료 리스트를 받아,
    AI + 웹검색으로 레시피 후보들을 생성하는 함수.

    여기 안에:
    - prompt 구성
    - 웹검색/LLM 호출
    - 결과를 RecipeSuggestion 리스트로 파싱
    를 구현하면 됨.
    """
    # TODO: 실제 AI 연동 구현
    # 아래는 임시 더미 데이터
    return [
        RecipeSuggestion(
            title="양파 달걀볶음밥",
            ingredients=["양파", "달걀", "밥", "간장"],
            instructions="양파와 달걀을 볶은 후 밥과 간장을 넣고 함께 볶아줍니다.",
            source_url=None,
            image_url=None,
            calories=550.0,
        )
    ]
