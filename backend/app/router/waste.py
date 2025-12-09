# app/routers/waste.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app import models, schemas
from app.services import waste_ai_service

router = APIRouter(prefix="/api/waste", tags=["food_waste"])


@router.post("/", response_model=schemas.FoodWasteOut)
def create_waste(
    payload: schemas.FoodWasteCreate,
    db: Session = Depends(get_db),
):
    record = models.FoodWaste(
        ingredient_name=payload.ingredient_name,
        amount_gram=payload.amount_gram,
        reason=payload.reason,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/", response_model=list[schemas.FoodWasteOut])
def list_waste(db: Session = Depends(get_db)):
    return db.query(models.FoodWaste).order_by(models.FoodWaste.discarded_at.desc()).all()

# -------------------------------------------------------------
# LLM 기반 분리배출 / 음식물 쓰레기 Q&A
# -------------------------------------------------------------

@router.post("/qa", response_model=schemas.WasteAnswerOut)
def ask_waste_guide(payload: schemas.WasteQuestion):
    """
    분리수거·음식물 쓰레기에 대한 질문을 하면,
    RAG(Gemini + 지침 PDF) 기반으로 답변을 돌려주는 엔드포인트.
    """
    answer, sources = waste_ai_service.answer_waste_question(payload.question)
    return schemas.WasteAnswerOut(
        question=payload.question,
        answer=answer,
        sources=sources,
    )