import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "FinSight AI ML Microservice"
    assert data["models_loaded"] is True


def test_disciplined_saver_segmentation():
    payload = {
        "monthly_income": 85000.0,
        "monthly_expense": 32000.0,
        "savings_rate": 62.35,
        "expense_ratio": 37.65,
        "discretionary_ratio": 0.15,
    }
    response = client.post("/segmentation/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["cluster_name"] == "Disciplined Saver"
    assert "surplus" in data["description"].lower()


def test_high_outflow_spender_segmentation():
    payload = {
        "monthly_income": 40000.0,
        "monthly_expense": 44000.0,
        "savings_rate": -10.0,
        "expense_ratio": 110.0,
        "discretionary_ratio": 0.55,
    }
    response = client.post("/segmentation/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["cluster_name"] == "High-Outflow Spender"
    assert "expenses consume" in data["description"].lower()


def test_balanced_spender_segmentation():
    payload = {
        "monthly_income": 55000.0,
        "monthly_expense": 45000.0,
        "savings_rate": 18.18,
        "expense_ratio": 81.82,
        "discretionary_ratio": 0.32,
    }
    response = client.post("/segmentation/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["cluster_name"] == "Balanced Spender"


def test_input_validation():
    # Negative income should fail validation
    payload = {
        "monthly_income": -100.0,
        "monthly_expense": 5000.0,
        "savings_rate": 0.0,
        "expense_ratio": 100.0,
        "discretionary_ratio": 0.2,
    }
    response = client.post("/segmentation/predict", json=payload)
    assert response.status_code == 422  # Unprocessable Entity
