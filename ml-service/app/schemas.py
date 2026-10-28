from pydantic import BaseModel, Field
from typing import List, Optional


class HealthResponse(BaseModel):
    status: str = "ok"
    service: str = "FinSight AI ML Microservice"
    version: str = "1.0.0"
    models_loaded: bool


class SpendingFeatures(BaseModel):
    monthly_income: float = Field(..., ge=0, description="Average monthly income")
    monthly_expense: float = Field(..., ge=0, description="Average monthly expense")
    savings_rate: float = Field(..., description="Savings rate percentage (income - expense)/income * 100")
    expense_ratio: float = Field(..., ge=0, description="Expense to income ratio percentage")
    discretionary_ratio: float = Field(default=0.3, ge=0.0, le=1.0, description="Ratio of discretionary spending to total expenses")


class SegmentationResponse(BaseModel):
    success: bool = True
    cluster_id: int
    cluster_name: str
    description: str
    recommendation: str
    profile_summary: dict
    model_version: str = "kmeans-v1.0"


class AnomalyItem(BaseModel):
    transaction_id: str
    amount: float
    category: str
    is_anomaly: bool
    anomaly_score: float
    reason: Optional[str] = None
