# app/routers/waste.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app import models, schemas

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
