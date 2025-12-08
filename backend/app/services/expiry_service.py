# app/services/expiry_service.py
from datetime import datetime, timedelta, date

# 카테고리/식재료별 보편적 소비기한 (예시)
DEFAULT_SHELF_LIFE_BY_CATEGORY = {
    "vegetable": 7,  # 채소 7일
    "fruit": 5,
    "meat": 3,
    "dairy": 5,
    "etc": 7,
}


def calculate_expected_expiry(category: str | None) -> date:
    """
    카테고리 기반 보편적 소비기한으로 예상 유통기한을 계산.
    (등록일 = 오늘 기준)
    """
    if not category:
        key = "etc"
    else:
        key = category.lower()
        if key not in DEFAULT_SHELF_LIFE_BY_CATEGORY:
            key = "etc"

    days = DEFAULT_SHELF_LIFE_BY_CATEGORY[key]
    return (datetime.utcnow() + timedelta(days=days)).date()
