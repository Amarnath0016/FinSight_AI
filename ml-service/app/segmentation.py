import os
import json
import joblib
import numpy as np
from app.schemas import SpendingFeatures, SegmentationResponse

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, "models")

MODEL_PATH = os.path.join(MODELS_DIR, "kmeans_model.joblib")
SCALER_PATH = os.path.join(MODELS_DIR, "scaler.joblib")
META_PATH = os.path.join(MODELS_DIR, "metadata.json")

_model = None
_scaler = None
_metadata = None


def load_artifacts():
    global _model, _scaler, _metadata
    if _model is None and os.path.exists(MODEL_PATH):
        _model = joblib.load(MODEL_PATH)
    if _scaler is None and os.path.exists(SCALER_PATH):
        _scaler = joblib.load(SCALER_PATH)
    if _metadata is None and os.path.exists(META_PATH):
        with open(META_PATH, "r") as f:
            _metadata = json.load(f)
    return _model is not None and _scaler is not None


def predict_segmentation(features: SpendingFeatures) -> SegmentationResponse:
    if not load_artifacts():
        raise RuntimeError("ML model or scaler artifacts are missing. Run train_segmentation.py first.")

    raw_vector = np.array([[
        features.monthly_income,
        features.monthly_expense,
        features.savings_rate,
        features.expense_ratio,
        features.discretionary_ratio,
    ]])

    scaled_vector = _scaler.transform(raw_vector)
    cluster_id = int(_model.predict(scaled_vector)[0])

    cluster_info = _metadata.get("cluster_labels", {}).get(
        str(cluster_id),
        {
            "name": f"Segment {cluster_id}",
            "description": "Standard spending profile.",
            "recommendation": "Review your monthly income and expenses regularly to maintain financial balance.",
        }
    )

    return SegmentationResponse(
        success=True,
        cluster_id=cluster_id,
        cluster_name=cluster_info["name"],
        description=cluster_info["description"],
        recommendation=cluster_info["recommendation"],
        profile_summary={
            "monthly_income": features.monthly_income,
            "monthly_expense": features.monthly_expense,
            "savings_rate": round(features.savings_rate, 2),
            "expense_ratio": round(features.expense_ratio, 2),
            "discretionary_ratio": round(features.discretionary_ratio, 2),
        },
        model_version=_metadata.get("model_version", "kmeans-v1.0"),
    )
