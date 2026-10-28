from fastapi.testclient import TestClient
from app.main import app
from app.sample import firewall_lesson

def test_health_reports_detected_models():
    with TestClient(app) as client:
        response=client.get("/api/health")
        assert response.status_code==200
        assert response.json()["service"]=="Blu Visual Teacher"
        assert isinstance(response.json()["models"],list)

def test_sample_lesson_has_four_distinct_teaching_scenes():
    lesson=firewall_lesson()
    assert lesson["sample"] is True
    assert len(lesson["scenes"])==4
    assert [s["kind"] for s in lesson["scenes"]]==["title","diagram","code","title"]
    assert sum(s["duration"] for s in lesson["scenes"])==60

def test_language_status_does_not_claim_missing_assets():
    with TestClient(app) as client:
        assert client.get("/api/languages/en").json()["installed"] is True
        assert client.get("/api/languages/hi").json()["installed"] is False
        assert client.get("/api/languages/zz").status_code==404

def test_unknown_lesson_is_404():
    with TestClient(app) as client:
        assert client.get("/api/lessons/not-a-real-id").status_code==404
