# app/schemas.py
from pydantic import BaseModel, EmailStr
from datetime import datetime, date
from typing import Optional, List, Any
from .models import FridgeIngredientStatus


# ---------- User / Auth ----------

class UserBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(UserBase):
    id: int

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------- 냉장고 재료 ----------

class FridgeIngredientBase(BaseModel):
    name: str
    category: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    expected_expiry: Optional[date] = None
    status: Optional[FridgeIngredientStatus] = FridgeIngredientStatus.FRESH
    image_path: Optional[str] = None


class FridgeIngredientCreate(BaseModel):
    """
    사진 없이 직접 입력하는 케이스에 사용할 수 있는 생성용 스키마 (여유로 만들어 둔 것)
    """
    name: str
    category: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    expected_expiry: Optional[date] = None

    class Config:
        from_attributes = True


class FridgeIngredientOut(FridgeIngredientBase):
    id: int
    registered_at: datetime

    class Config:
        orm_mode = True


# ---------- 음식물 쓰레기 ----------

class FoodWasteCreate(BaseModel):
    ingredient_name: str
    amount_gram: float
    reason: Optional[str] = None


class FoodWasteOut(BaseModel):
    id: int
    ingredient_name: str
    amount_gram: float
    discarded_at: datetime
    reason: Optional[str]

    class Config:
        orm_mode = True


# ---------- 레시피 ----------

class RecipeBase(BaseModel):
    title: str
    ingredients: List[str]          # 간단히 문자열 리스트로 (예: ["양파", "달걀", "밥"])
    instructions: str | None = None
    source_url: str | None = None
    image_url: str | None = None
    calories: float | None = None
    source_type: str = "ai"


class RecipeOut(RecipeBase):
    id: int

    class Config:
        orm_mode = True


# AI로부터 받은 추천용 임시 구조 (DB에 저장 전)
class RecipeSuggestion(BaseModel):
    title: str
    ingredients: List[str]
    instructions: str | None = None
    source_url: str | None = None
    image_url: str | None = None
    calories: float | None = None


# 즐겨찾기

class FavoriteRecipeOut(BaseModel):
    id: int
    recipe: RecipeOut  # 조인해서 레시피까지 같이 반환하는 걸 권장

    class Config:
        orm_mode = True


# 레시피 히스토리

class RecipeHistoryCreate(BaseModel):
    recipe_id: int
    rating: float | None = None
    memo: str | None = None


class RecipeHistoryOut(BaseModel):
    id: int
    recipe: RecipeOut
    cooked_at: datetime
    rating: float | None = None
    memo: str | None = None

    class Config:
        orm_mode = True


# 요청용 스키마
class RecipeSuggestRequest(BaseModel):
    ingredients: List[str]

    class Config:
        from_attributes = True


# -------------------------------------------------------------
# 분리배출 / 음식물 쓰레기 Q&A용 스키마
# -------------------------------------------------------------

class WasteQuestion(BaseModel):
    question: str


class WasteAnswerOut(BaseModel):
    question: str
    answer: str
    sources: list[str]
