# app/main.py
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .db import Base, engine
from .router import ingredients, waste, recipes, auth
from app.services.recipe_ai_service import init_recipe_rag
import os
print("Loaded API KEY:", os.getenv("GEMINI_API_KEY"))


# DB 테이블 생성
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Smart Fridge Backend",
    description="1인 가구 식재료 낭비 감소 & 유통기한 관리 자동화를 위한 스마트 냉장고 관리 서비스",
)


origins = [
    "http://localhost:8081",  # Expo Web 기본 포트
    "http://127.0.0.1:8081",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    # 개발 단계면 "*"도 가능
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,     # 필요하면 ["*"]로 풀기
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(auth.router)
app.include_router(ingredients.router)
app.include_router(waste.router)
app.include_router(recipes.router)

# RAG 초기화 (나중에 사용)
# @app.on_event("startup")
# async def startup_event():
#     init_recipe_rag()


# 헬스 체크용 엔드포인트
@app.get("/health")
def health_check():
    return {"status": "ok", "message": "backend is alive"}
