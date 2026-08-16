import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models import User, Feedback
from app.utils import decode_token
from app.config import settings

client = TestClient(app)

def clean_test_users():
    db = SessionLocal()
    try:
        db.query(Feedback).filter(Feedback.comment.like("%[TEST-ISO]%")).delete(synchronize_session=False)
        db.query(User).filter(User.email.like("%test-iso%")).delete(synchronize_session=False)
        db.commit()
    except Exception as e:
        print("CLEAN ERROR:", e)
        db.rollback()
    finally:
        db.close()

def test_registration_and_login_isolation():
    clean_test_users()

    farmers = [
        {"username": "Farmer One", "email": "farmer1@test-iso.com", "password": "Password123!", "confirm_password": "Password123!", "role": "farmer", "region": "Punjab", "language_id": 1},
        {"username": "Farmer Two", "email": "farmer2@test-iso.com", "password": "Password123!", "confirm_password": "Password123!", "role": "farmer", "region": "Haryana", "language_id": 1}
    ]
    admins = [
        {"username": "Admin One", "email": "admin1@test-iso.com", "password": "Password123!", "confirm_password": "Password123!", "role": "admin", "region": "Central", "language_id": 1},
        {"username": "Admin Two", "email": "admin2@test-iso.com", "password": "Password123!", "confirm_password": "Password123!", "role": "admin", "region": "Central", "language_id": 1}
    ]

    # Register all
    for f in farmers:
        response = client.post("/register", json=f)
        assert response.status_code == 201

    for a in admins:
        response = client.post("/register", json=a)
        assert response.status_code == 201

    # Login Farmer 1
    login_resp = client.post("/login", json={"email": "farmer1@test-iso.com", "password": "Password123!"})
    assert login_resp.status_code == 200
    token1 = login_resp.json()["access_token"]
    payload1 = decode_token(token1, settings.JWT_SECRET_KEY)
    print("\nFARMER 1 PAYLOAD:", payload1)
    headers1 = {"Authorization": f"Bearer {token1}"}

    # Submit feedback by Farmer 1
    fb_create_resp = client.post("/feedback/", json={"rating": 5, "comment": "[TEST-ISO] Great platform!", "category": "general"}, headers=headers1)
    assert fb_create_resp.status_code == 201
    print("SUBMITTED FB RESPONSE:", fb_create_resp.json())

    # Login Farmer 2
    login_resp2 = client.post("/login", json={"email": "farmer2@test-iso.com", "password": "Password123!"})
    assert login_resp2.status_code == 200
    token2 = login_resp2.json()["access_token"]
    payload2 = decode_token(token2, settings.JWT_SECRET_KEY)
    print("FARMER 2 PAYLOAD:", payload2)
    headers2 = {"Authorization": f"Bearer {token2}"}

    # Verify what Farmer 2 sees
    fb_list_resp2 = client.get("/feedback/", headers=headers2)
    print("FARMER 2 GET FB RESPONSE:", fb_list_resp2.json())
    
    assert len(fb_list_resp2.json()) == 0

    clean_test_users()
