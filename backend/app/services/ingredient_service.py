# app/services/ingredient_service.py
from datetime import datetime, timedelta
from typing import Tuple

# 나중에 YOLO 분석 결과 들어올 자리
def detect_ingredient_from_image(image_bytes: bytes) -> Tuple[str, str]:
    """
    TODO: YOLO 모델 붙이면 여기서 실제 식재료 감지
    지금은 테스트용으로 임의 값 반환
    """
    # 예: 이미지를 항상 "양파"라고 인식한다고 가정
    name = "양파"
    category = "채소"
    return name, category


def get_default_shelf_life_days(category: str) -> int:
    """
    카테고리별 보편적 소비기한(일)을 대략 지정
    나중에 더 세분화 가능
    """
    category = (category or "").lower()
    if "육" in category or "meat" in category:
        return 3
    if "생선" in category or "fish" in category:
        return 2
    if "유제품" in category or "dairy" in category:
        return 5
    if "채소" in category or "야채" in category or "vegetable" in category:
        return 7
    if "과일" in category or "fruit" in category:
        return 5
    return 7  # 기본값
