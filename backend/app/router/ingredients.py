# app/router/ingredients.py
from fastapi import APIRouter, UploadFile, File, Depends
from sqlalchemy.orm import Session
from datetime import datetime
from pathlib import Path
import shutil

from app.db import get_db
from app import models, schemas
from app.services.yolo_service import detect_ingredient
from app.services.expiry_service import calculate_expected_expiry
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/api/ingredients", tags=["ingredients"])

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


@router.post("/scan", response_model=schemas.FridgeIngredientOut)
async def scan_ingredient(
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    YOLO로 인식 + 소비기한 계산 + 현재 유저의 냉장고에 저장
    """

    # 1) 이미지 서버에 저장
    timestamp = int(datetime.utcnow().timestamp())
    filename = f"{timestamp}_{image.filename}"
    file_path = UPLOAD_DIR / filename

    with file_path.open("wb") as buffer:
        shutil.copyfileobj(image.file, buffer)

    # 2) YOLO로 식재료 인식
    detected_name, confidence = detect_ingredient(str(file_path))

    # TODO: label → category 매핑 로직 추가 (예: onion -> vegetable)
    category = "vegetable"

    # 3) 보편적 소비기한 기준 예상 유통기한 계산
    expected_expiry = calculate_expected_expiry(category)

    # 4) DB 저장 (초기 기본값: quantity=1, unit="ea")
    ingredient = models.FridgeIngredient(
        user_id=current_user.id,
        name=detected_name,
        category=category,
        quantity=1.0,
        unit="ea",
        expected_expiry=expected_expiry,
        status=models.FridgeIngredientStatus.FRESH,
        image_path=str(file_path),
    )

    db.add(ingredient)
    db.commit()
    db.refresh(ingredient)

    return ingredient


@router.get("/", response_model=list[schemas.FridgeIngredientOut])
def list_ingredients(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    현재 로그인한 유저의 냉장고 재료만 반환
    """
    q = (
        db.query(models.FridgeIngredient)
        .filter(models.FridgeIngredient.user_id == current_user.id)
        .order_by(models.FridgeIngredient.expected_expiry.asc().nulls_last())
    )
    return q.all()


@router.post("/manual", response_model=schemas.FridgeIngredientOut)
def create_ingredient_manual(
    payload: schemas.FridgeIngredientCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    YOLO 없이 사용자가 직접 입력해서 재료를 등록.
    """
    category = payload.category or "etc"

    if payload.expected_expiry is None:
        expected_expiry = calculate_expected_expiry(category)
    else:
        expected_expiry = payload.expected_expiry

    ingredient = models.FridgeIngredient(
        user_id=current_user.id,
        name=payload.name,
        category=category,
        quantity=payload.quantity,
        unit=payload.unit,
        expected_expiry=expected_expiry,
        status=models.FridgeIngredientStatus.FRESH,
        image_path=None,
    )

    db.add(ingredient)
    db.commit()
    db.refresh(ingredient)
    return ingredient
