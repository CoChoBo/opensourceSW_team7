# models.py
from sqlalchemy import Column, Integer, String, Date, DateTime, Float, Enum
from sqlalchemy.sql import func
from database import Base
import enum
from sqlalchemy.dialects.postgresql import JSON

class IngredientStatus(str, enum.Enum):
    FRESH = "fresh"      # 신선
    WARNING = "warning"  # 주의
    EXPIRED = "expired"  # 폐기

# 냉장고 식재료
class FridgeIngredient(Base):
    __tablename__ = "fridge_ingredients"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)  # 사용자 ID
    name = Column(String, nullable=False)          # 식재료명
    category = Column(String, nullable=True)       # 채소/과일/육류 등
    quantity = Column(Float, nullable=True)        # 수량
    unit = Column(String, nullable=True)           # g, 개, ml 등
    registered_at = Column(DateTime, server_default=func.now())  # 등록일
    expected_expiry = Column(Date, nullable=True)  # 예상_유통기한
    status = Column(Enum(IngredientStatus), default=IngredientStatus.FRESH)
    image_path = Column(String, nullable=True)     # 이미지_경로 (서버 내 경로 또는 URL)


# 레시피
class RecipeHistory(Base):
    __tablename__ = "recipe_history"

    id = Column(Integer, primary_key=True, index=True)
    recipe_name = Column(String, nullable=False)      # 레시피명
    used_ingredients = Column(JSON, nullable=False)   # 사용_재료들 (JSON)
    cooked_at = Column(DateTime, server_default=func.now())  # 조리일
    rating = Column(Float, nullable=True)             # 평점 (1~5 등)