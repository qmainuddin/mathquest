import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_score_unauthorized_without_header():
    payload = {
        "child_id": "c1",
        "topic_id": "t1",
        "attempts": [],
    }
    res = client.post("/v1/score", json=payload)
    assert res.status_code == 401
    assert "Unauthorized" in res.json()["detail"]

def test_score_unauthorized_with_wrong_token():
    payload = {
        "child_id": "c1",
        "topic_id": "t1",
        "attempts": [],
    }
    res = client.post("/v1/score", json=payload, headers={"X-Internal-Secret": "invalid-token-123"})
    assert res.status_code == 401

def test_recommend_unauthorized_without_header():
    payload = {
        "child_id": "c1",
        "mastery_snapshots": [],
    }
    res = client.post("/v1/recommend", json=payload)
    assert res.status_code == 401
