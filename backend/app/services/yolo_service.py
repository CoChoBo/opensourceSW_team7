# app/services/yolo_service.py
from pathlib import Path
from functools import lru_cache
from typing import Tuple

from ultralytics import YOLO

# 나중에 커스텀 모델을 여기에 두면 됨: backend/models/food_yolo.pt
CUSTOM_MODEL_PATH = Path("models/food_yolo.pt")

@lru_cache(maxsize=1)
def get_yolo_model() -> YOLO:
    """
    YOLO 모델을 한 번만 로드해서 캐시.
    (요청마다 새로 로드하면 너무 느려짐)
    """
    if CUSTOM_MODEL_PATH.exists():
        print(f"[YOLO] Using custom model: {CUSTOM_MODEL_PATH}")
        return YOLO(str(CUSTOM_MODEL_PATH))

    print("[YOLO] Custom model not found. Using default 'yolov8n.pt'")
    # 처음 한 번은 자동으로 다운로드됨
    return YOLO("yolov8n.pt")


def detect_ingredient(image_path: str) -> Tuple[str, float]:
    """
    이미지 파일 경로를 받아서
    - YOLO 추론을 수행하고
    - 가장 확률 높은 박스의 라벨과 confidence를 반환.

    return: (식재료명(label), confidence)
    """
    model = get_yolo_model()

    # imgsz, conf threshold 등은 필요에 따라 조정
    results = model(
        image_path,
        imgsz=640,
        conf=0.3,
        verbose=False,
    )

    # ultralytics 는 리스트로 결과를 주는데, 단일 이미지면 [0] 하나만 존재
    result = results[0]

    if result.boxes is None or len(result.boxes) == 0:
        # 아무것도 검출 안 된 경우
        return "unknown", 0.0

    # 가장 confidence 높은 박스 선택
    # (이미 정렬되어 있는 경우가 많지만, 안전하게 max 한 번 더)
    best_box = max(result.boxes, key=lambda b: float(b.conf))

    cls_idx = int(best_box.cls)
    conf = float(best_box.conf)

    # model.names 에 클래스 인덱스 → 라벨 이름 매핑이 들어 있음
    label = str(model.names[cls_idx])

    return label, conf

LABEL_TO_KO = {
    "onion": ("양파", "채소"),
    "carrot": ("당근", "채소"),
    "apple": ("사과", "과일"),
    "banana": ("바나나", "과일"),
    # ... 필요한 만큼 추가
}

def map_label_to_name_category(raw_label: str) -> tuple[str, str]:
    """
    YOLO 라벨(영어)을 우리 서비스에서 쓰는 한글 이름/카테고리로 변환.
    매핑이 없으면 라벨 그대로 쓰고 카테고리는 '기타'로.
    """
    if raw_label in LABEL_TO_KO:
        ko_name, category = LABEL_TO_KO[raw_label]
        return ko_name, category
    # 기본값
    return raw_label, "기타"