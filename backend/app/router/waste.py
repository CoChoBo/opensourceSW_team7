# app/router/waste.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app import models, schemas
from app.services import waste_ai_service
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/api/waste", tags=["food_waste"])


@router.post("/", response_model=schemas.FoodWasteOut)
def create_waste(
    payload: schemas.FoodWasteCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    record = models.FoodWaste(
        user_id=current_user.id,
        ingredient_name=payload.ingredient_name,
        amount_gram=payload.amount_gram,
        reason=payload.reason,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/", response_model=list[schemas.FoodWasteOut])
def list_waste(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return (
        db.query(models.FoodWaste)
        .filter(models.FoodWaste.user_id == current_user.id)
        .order_by(models.FoodWaste.discarded_at.desc())
        .all()
    )


# -------------------------------------------------------------
# LLM 기반 분리배출 / 음식물 쓰레기 Q&A
# -------------------------------------------------------------

@router.post("/qa", response_model=schemas.WasteAnswerOut)
def ask_waste_guide(payload: schemas.WasteQuestion):
    """
    분리수거·음식물 쓰레기에 대한 질문 → RAG 기반 답변
    (사용자별 정보와 무관)
    """
    answer, sources = waste_ai_service.answer_waste_question(payload.question)
    return schemas.WasteAnswerOut(
        question=payload.question,
        answer=answer,
        sources=sources,
    )
