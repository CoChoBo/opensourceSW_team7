# app/router/recipes.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app import models, schemas
from app.services.recipe_ai_service import suggest_recipes_from_ingredients
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/api/recipes", tags=["recipes"])


@router.post("/suggest", response_model=list[schemas.RecipeOut])
def suggest_recipes(
    payload: schemas.RecipeSuggestRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    선택한 재료 → AI 레시피 추천 → Recipe 테이블에 저장 (공용)
    """
    ingredient_names = payload.ingredients

    if not ingredient_names:
        raise HTTPException(status_code=400, detail="ingredients 리스트가 비어 있습니다.")

    suggestions = suggest_recipes_from_ingredients(ingredient_names)

    recipe_objs: list[models.Recipe] = []
    for s in suggestions:
        r = models.Recipe(
            title=s.title,
            ingredients=s.ingredients,
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
def favorite_recipe(
    recipe_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    현재 유저의 즐겨찾기 레시피 등록
    """
    recipe = db.get(models.Recipe, recipe_id)
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    fav = models.FavoriteRecipe(user_id=current_user.id, recipe_id=recipe_id)
    db.add(fav)
    db.commit()
    db.refresh(fav)

    fav.recipe = recipe
    return fav


@router.get("/favorites", response_model=list[schemas.FavoriteRecipeOut])
def list_favorites(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    현재 유저의 즐겨찾기 목록 반환
    """
    favs = db.query(models.FavoriteRecipe).filter(
        models.FavoriteRecipe.user_id == current_user.id
    ).all()

    recipe_map = {
        r.id: r
        for r in db.query(models.Recipe).filter(
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
    current_user: models.User = Depends(get_current_user),
):
    recipe = db.get(models.Recipe, payload.recipe_id)
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    hist = models.RecipeHistory(
        user_id=current_user.id,
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
def list_history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    history = (
        db.query(models.RecipeHistory)
        .filter(models.RecipeHistory.user_id == current_user.id)
        .order_by(models.RecipeHistory.cooked_at.desc())
        .all()
    )

    recipe_map = {
        r.id: r
        for r in db.query(models.Recipe).filter(
            models.Recipe.id.in_([h.recipe_id for h in history])
        )
    }
    for h in history:
        h.recipe = recipe_map.get(h.recipe_id)

    return history
