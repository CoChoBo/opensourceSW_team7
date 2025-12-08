# app/routers/ingredients.py
from fastapi import APIRouter, UploadFile, File, Depends
from sqlalchemy.orm import Session
from datetime import datetime
from pathlib import Path
import shutil

from app.db import get_db
from app import models, schemas
from app.services.yolo_service import detect_ingredient, map_label_to_name_category
from app.services.expiry_service import calculate_expected_expiry

router = APIRouter(prefix="/api/ingredients", tags=["ingredients"])

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


@router.post("/scan", response_model=schemas.FridgeIngredientOut)
async def scan_ingredient(
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    1) 이미지를 업로드 받고
    2) YOLO로 식재료를 인식한 뒤
    3) 보편적인 소비기한을 계산하여
    4) 냉장고_재료 DB에 저장하는 엔드포인트
    """

    # 1) 이미지 서버에 저장
    timestamp = int(datetime.utcnow().timestamp())
    filename = f"{timestamp}_{image.filename}"
    file_path = UPLOAD_DIR / filename

    with file_path.open("wb") as buffer:
        shutil.copyfileobj(image.file, buffer)

    # 2) YOLO로 식재료 인식
    raw_label, confidence = detect_ingredient(str(file_path))

    # 라벨을 우리 서비스용 한글 이름/카테고리로 매핑
    detected_name, category = map_label_to_name_category(raw_label)

    # 3) 보편적 소비기한 기준 예상 유통기한 계산
    expected_expiry = calculate_expected_expiry(category)

    # 4) DB 저장 (초기 기본값: quantity=1, unit="ea")
    ingredient = models.FridgeIngredient(
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
    order: str = "expiry",  # "expiry" or "recent"
    db: Session = Depends(get_db),
):
    """
    냉장고 재료 목록 조회.

    - order="expiry": 소비기한 임박 순 (알리미용 기본)
    - order="recent": 최근 등록 순 (디버그/관리용)
    """
    q = db.query(models.FridgeIngredient)

    if order == "recent":
        q = q.order_by(models.FridgeIngredient.id.desc())
    else:  # 기본값: expiry
        q = q.order_by(models.FridgeIngredient.expected_expiry.asc())

    return q.all()