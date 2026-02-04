from fastapi.testclient import TestClient
from src.app import app

client = TestClient(app)


def test_get_activities():
    res = client.get("/activities")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data


def test_signup_and_unregister():
    activity = "Chess Club"
    email = "tester@example.com"

    # Ensure clean state: remove email if already present
    res = client.get("/activities")
    assert res.status_code == 200
    data = res.json()
    if email in data.get(activity, {}).get("participants", []):
        client.post(f"/activities/{activity}/unregister?email={email}")

    # Sign up
    res = client.post(f"/activities/{activity}/signup?email={email}")
    assert res.status_code == 200
    assert "Signed up" in res.json().get("message", "")

    # Confirm participant was added
    res = client.get("/activities")
    data = res.json()
    assert email in data[activity]["participants"]

    # Unregister
    res = client.post(f"/activities/{activity}/unregister?email={email}")
    assert res.status_code == 200
    assert "Unregistered" in res.json().get("message", "")

    # Confirm participant was removed
    res = client.get("/activities")
    data = res.json()
    assert email not in data[activity]["participants"]
