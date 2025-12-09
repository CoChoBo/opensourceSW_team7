# app/routers/recipes.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app import models, schemas
from app.services.recipe_ai_service import suggest_recipes_from_ingredients

router = APIRouter(prefix="/api/recipes", tags=["recipes"])


@router.post("/suggest", response_model=list[schemas.RecipeOut])
def suggest_recipes(payload: schemas.RecipeSuggestRequest, db: Session = Depends(get_db)):
    """
    1) 프론트에서 식재료 리스트 전달 받기
    2) AI 레시피 서비스에게 전달하여 Gemini + CSV RAG로 레시피를 생성하고 추천 레시피 리스트 받기
    3) 받은 레시피를 DB Recipe 테이블에 저장한 뒤, 그 내용을 반환
       (즐겨찾기/히스토리에서 재사용 가능하도록)
    """
    # 1) 선택한 재료 리스트 받기
    ingredient_names = payload.ingredients

    if not ingredient_names:
        raise HTTPException(status_code=400, detail="ingredients 리스트가 비어 있습니다.")

    # 2) AI 레시피 서비스 호출
    suggestions = suggest_recipes_from_ingredients(ingredient_names)

    # 3) DB에 저장 (이미 비슷한 레시피가 있으면 재사용해도 됨 → 나중에 개선)
    recipe_objs: list[models.Recipe] = []
    for s in suggestions:
        r = models.Recipe(
            title=s.title,
            ingredients=s.ingredients,        # JSON 컬럼으로 자동 매핑
            instructions=s.instructions,
            source_url=s.source_url,
            image_url=s.image_url,
            calories=s.calories,
            source_type="ai",
        )
        db.add(r)
        recipe_objs.append(r)

    db.commit()
    for r in recipe_objs:
        db.refresh(r)

    return recipe_objs

@router.post("/favorite/{recipe_id}", response_model=schemas.FavoriteRecipeOut)
def favorite_recipe(recipe_id: int, db: Session = Depends(get_db)):
    """
    레시피 즐겨찾기 등록
    (이미 즐겨찾기된 경우 중복 방지 로직 등을 나중에 추가 가능)
    """
    # 레시피 존재 확인
    recipe = db.get(models.Recipe, recipe_id)
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    fav = models.FavoriteRecipe(recipe_id=recipe_id)
    db.add(fav)
    db.commit()
    db.refresh(fav)

    # 조인해서 응답
    fav.recipe = recipe
    return fav


@router.get("/favorites", response_model=list[schemas.FavoriteRecipeOut])
def list_favorites(db: Session = Depends(get_db)):
    """
    즐겨찾기 레시피 목록 반환
    """
    favs = db.query(models.FavoriteRecipe).all()
    # 수동으로 recipe 객체 채워주기 (간단 버전)
    recipe_map = {
        r.id: r for r in db.query(models.Recipe).filter(
            models.Recipe.id.in_([f.recipe_id for f in favs])
        )
    }
    for f in favs:
        f.recipe = recipe_map.get(f.recipe_id)

    return favs

@router.post("/history", response_model=schemas.RecipeHistoryOut)
def add_history(
    payload: schemas.RecipeHistoryCreate,
    db: Session = Depends(get_db),
):
    recipe = db.get(models.Recipe, payload.recipe_id)
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    hist = models.RecipeHistory(
        recipe_id=payload.recipe_id,
        rating=payload.rating,
        memo=payload.memo,
    )
    db.add(hist)
    db.commit()
    db.refresh(hist)

    hist.recipe = recipe
    return hist


@router.get("/history", response_model=list[schemas.RecipeHistoryOut])
def list_history(db: Session = Depends(get_db)):
    history = db.query(models.RecipeHistory).order_by(
        models.RecipeHistory.cooked_at.desc()
    ).all()

    recipe_map = {
        r.id: r for r in db.query(models.Recipe).filter(
            models.Recipe.id.in_([h.recipe_id for h in history])
        )
    }
    for h in history:
        h.recipe = recipe_map.get(h.recipe_id)

    return history
