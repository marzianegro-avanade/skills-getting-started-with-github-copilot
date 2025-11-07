import pytest
from fastapi.testclient import TestClient
from src.app import app

client = TestClient(app)


def test_get_activities():
    response = client.get("/activities")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    assert all("participants" in v for v in data.values())


def test_signup_and_unregister():
    activity = next(iter(client.get("/activities").json().keys()))
    email = "pytestuser@mergington.edu"

    # Signup
    signup_resp = client.post(f"/activities/{activity}/signup?email={email}")
    assert signup_resp.status_code == 200
    assert f"Signed up {email}" in signup_resp.json()["message"]

    # Duplicate signup should fail
    dup_resp = client.post(f"/activities/{activity}/signup?email={email}")
    assert dup_resp.status_code == 400

    # Unregister
    unreg_resp = client.post(f"/activities/{activity}/unregister?email={email}")
    assert unreg_resp.status_code == 200
    assert f"Unregistered {email}" in unreg_resp.json()["message"]

    # Unregister again should fail
    unreg_again = client.post(f"/activities/{activity}/unregister?email={email}")
    assert unreg_again.status_code == 400
