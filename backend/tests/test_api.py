"""
backend/tests/test_api.py
-------------------------
FastAPI Integration & Regression Test Suite using starlette TestClient.
"""

import pytest
from starlette.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "version" in data
    assert "lancedb_ready" in data


def test_storage_stats_endpoint():
    response = client.get("/api/storage/stats")
    assert response.status_code == 200
    data = response.json()
    assert data["bucket"] == "uth-scientific-lakehouse"
    assert "zones" in data
    assert data["zones"]["bronzeCount"] > 0
    assert data["zones"]["goldChunkCount"] > 0


def test_search_endpoint():
    payload = {
        "query": "diffusion models",
        "top_k": 3,
        "mode": "fts",
    }
    response = client.post("/api/search", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["query"] == "diffusion models"
    assert "results" in data
    assert len(data["results"]) <= 3


def test_chat_endpoint():
    payload = {
        "query": "What is the role of sampling in diffusion distillation?",
        "top_k": 2,
    }
    response = client.post("/api/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert "citations" in data
    assert "similarity_score" in data


def test_mining_eda_endpoint():
    response = client.get("/api/mining/eda")
    assert response.status_code == 200
    data = response.json()
    assert data["dataset_overview"]["total_papers"] == 10000
    assert len(data["category_distribution"]) > 0
    assert len(data["top_authors"]) > 0


def test_mining_association_rules_endpoint():
    response = client.get("/api/mining/pillars/association-rules")
    assert response.status_code == 200
    data = response.json()
    assert "rules" in data
    assert len(data["rules"]) > 0


def test_mining_clusters_endpoint():
    response = client.get("/api/mining/pillars/clusters")
    assert response.status_code == 200
    data = response.json()
    assert "validity_metrics" in data
    assert "cluster_profiles" in data
    assert len(data["cluster_profiles"]) > 0


def test_mining_graph_endpoint():
    response = client.get("/api/mining/pillars/graph")
    assert response.status_code == 200
    data = response.json()
    assert data["network_summary"]["total_authors"] > 0
    assert len(data["graph_export"]["nodes"]) > 0


def test_mining_trends_endpoint():
    response = client.get("/api/mining/pillars/trends")
    assert response.status_code == 200
    data = response.json()
    assert "anomalies" in data
    assert len(data["anomalies"]) > 0
    assert len(data["trend_velocity"]) > 0


def test_mining_manifest_endpoint():
    response = client.get("/api/mining/manifest")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "COMPLETED"
