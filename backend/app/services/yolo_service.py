# app/services/yolo_service.py
from typing import Tuple

"""
실제 YOLO 모델 로딩/추론은 나중에 채우면 됨.
지금은 인터페이스(함수 모양)만 맞춰놓고, 임시 더미 값 반환.
"""


def detect_ingredient(image_path: str) -> Tuple[str, float]:
    """
    이미지 경로를 받아서 (식재료명, confidence)를 반환.
    ex) ("onion", 0.92)
    """
    # TODO: YOLO 모델 로딩 & 추론 구현
    # model = ...
    # results = model(image_path)
    # label = ...
    # conf = ...
    label = "onion"
    confidence = 0.92
    return label, confidence
