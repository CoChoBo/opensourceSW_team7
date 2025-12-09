# app/models.py
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    Date,
    Enum,
)
from sqlalchemy.sql import func
from .db import Base
import enum
from sqlalchemy.dialects.sqlite import JSON


# 냉장고 재료 상태 Enum
class FridgeIngredientStatus(str, enum.Enum):
    FRESH = "fresh"       # 신선
    WARNING = "warning"   # 소비기한 임박
    EXPIRED = "expired"   # 폐기 대상


class FridgeIngredient(Base):
    """
    1인 가구 식재료 관리 + 유통기한 자동화의 핵심 테이블
    """
    __tablename__ = "fridge_ingredients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)           # 식재료명
    category = Column(String, nullable=True)        # 채소/과일/육류/유제품 등
    quantity = Column(Float, nullable=True)         # 수량
    unit = Column(String, nullable=True)            # g, 개, ml 등
    registered_at = Column(
        DateTime, server_default=func.now()
    )                                              # 등록일
    expected_expiry = Column(Date, nullable=True)  # 보편적 소비기한 기준 예상 유통기한
    status = Column(
        Enum(FridgeIngredientStatus),
        default=FridgeIngredientStatus.FRESH,
        nullable=False,
    )                                              # 신선/주의/폐기
    image_path = Column(String, nullable=True)      # 서버 내 이미지 경로 or URL


class FoodWaste(Base):
    """
    음식물 쓰레기 발생량 기록 테이블
    주간/월간 비교, 감소량 분석, 포인트 연동 등에 사용
    """
    __tablename__ = "food_waste"

    id = Column(Integer, primary_key=True, index=True)
    ingredient_name = Column(String, nullable=False)  # 식재료명
    amount_gram = Column(Float, nullable=False)       # 배출량(g)
    discarded_at = Column(DateTime, server_default=func.now())  # 배출일
    reason = Column(String, nullable=True)            # 폐기 사유 (유통기한 경과, 부패 등)


class Recipe(Base):
    """
    AI/웹검색 기반으로 추천된 레시피를 저장해두는 테이블.
    - 꼭 모든 추천을 저장하지 않아도 되고
    - 즐겨찾기/히스토리 등록할 때 함께 저장해도 됨.
    """
    __tablename__ = "recipes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)              # 레시피명
    ingredients = Column(JSON, nullable=False)          # 사용 재료들 (JSON 리스트)
    instructions = Column(String, nullable=True)        # 조리 순서(간단한 텍스트)
    source_url = Column(String, nullable=True)          # 원본 레시피 링크 (있으면)
    image_url = Column(String, nullable=True)           # 레시피 대표 이미지
    calories = Column(Float, nullable=True)             # 1인분 기준 칼로리(옵션)
    created_at = Column(DateTime, server_default=func.now())
    # AI 생성인지, 외부 검색인지 구분할 수 있는 플래그
    source_type = Column(String, default="ai")          # ai / web / user 등

class FavoriteRecipe(Base):
    """
    사용자가 즐겨찾기한 레시피.
    (지금은 단일 사용자 가정으로 user_id 생략, 나중에 추가 가능)
    """
    __tablename__ = "favorite_recipes"

    id = Column(Integer, primary_key=True, index=True)
    recipe_id = Column(Integer, nullable=False)        # Recipe.id 참조
    created_at = Column(DateTime, server_default=func.now())

class RecipeHistory(Base):
    """
    실제로 조리한 레시피 기록 (언제, 어떤 레시피, 평점)
    """
    __tablename__ = "recipe_history"

    id = Column(Integer, primary_key=True, index=True)
    recipe_id = Column(Integer, nullable=False)        # Recipe.id 참조
    cooked_at = Column(DateTime, server_default=func.now())
    rating = Column(Float, nullable=True)              # 평점 (1~5 등)
    memo = Column(String, nullable=True)               # 메모 (선택)
