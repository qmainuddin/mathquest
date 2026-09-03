import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.config import settings

client = TestClient(app)

AUTH_HEADER = {"X-Internal-Secret": settings.internal_service_token}

def test_healthz_endpoint():
    res = client.get("/healthz")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["service"] == "mathquest-scoring"
    assert data["port"] == settings.port

def test_correlation_id_propagation():
    custom_id = "test-corr-id-12345"
    res = client.get("/healthz", headers={"X-Correlation-ID": custom_id})
    assert res.status_code == 200
    assert res.headers.get("X-Correlation-ID") == custom_id

def test_score_endpoint_success():
    payload = {
        "child_id": "child-test-1",
        "topic_id": "addition_subtraction",
        "attempts": [
            {"question_id": "q1", "attempt_number": 1, "is_correct": True, "duration_ms": 10000},
            {"question_id": "q2", "attempt_number": 1, "is_correct": True, "duration_ms": 12000},
            {"question_id": "q3", "attempt_number": 1, "is_correct": True, "duration_ms": 15000},
        ],
    }
    res = client.post("/v1/score", json=payload, headers=AUTH_HEADER)
    assert res.status_code == 200
    data = res.json()
    assert data["score"] == 100.0
    assert data["is_sufficient_data"] is True
    assert data["algorithm_version"] == "rule_v1.0.0"

def test_recommend_endpoint_success():
    payload = {
        "child_id": "child-test-1",
        "mastery_snapshots": [
            {"topic_id": "number_sense", "score": 85.0, "confidence": 1.0, "sample_count": 10}
        ],
        "completed_lesson_ids": ["ns_place_value_100"],
    }
    res = client.post("/v1/recommend", json=payload, headers=AUTH_HEADER)
    assert res.status_code == 200
    data = res.json()
    assert data["recommended_topic_id"] == "addition_subtraction"
    assert "explanation" in data
    assert data["algorithm_version"] == "recommender_v1.0.0"
