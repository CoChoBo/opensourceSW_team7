# app/router/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app import models, schemas
from app.services.auth_service import hash_password, verify_password, get_current_user
from app.services.jwt_service import create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=schemas.UserOut)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    회원가입
    """
    existed = db.query(models.User).filter(models.User.email == user_in.email).first()
    if existed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    user = models.User(
        email=user_in.email,
        name=user_in.name,
        password_hash=hash_password(user_in.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=schemas.Token)
def login(payload: schemas.UserLogin, db: Session = Depends(get_db)):
    """
    로그인 → JWT 토큰 발급
    """
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email or password",
        )

    token = create_access_token(user.email)
    return schemas.Token(
        access_token=token,
        user=schemas.UserOut(id=user.id, email=user.email, name=user.name),
    )


@router.get("/me", response_model=schemas.UserOut)
def get_me(current_user: models.User = Depends(get_current_user)):
    """
    내 정보 조회
    """
    return schemas.UserOut(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
    )
