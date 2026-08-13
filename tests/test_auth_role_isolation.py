"""Automated tests for Farmer/Admin authentication, role isolation, and User Management."""

import pytest
from app.security import get_password_hash
from app.utils import decode_token
from app.config import settings

def test_farmer_registration_and_login(client):
    """Test 1 — Farmer registration & login: valid farmer credentials return role='farmer'."""
    import uuid
    email = f"testfarmer_{uuid.uuid4().hex[:8]}@example.com"
    reg_payload = {
        "username": "testfarmer1",
        "email": email,
        "password": "Password123!",
        "confirm_password": "Password123!",
        "language_id": 1,
        "region": "Punjab"
    }
    reg_res = client.post("/register", json=reg_payload)
    assert reg_res.status_code == 201, reg_res.text

    # Login as Farmer
    login_payload = {
        "email": email,
        "password": "Password123!",
        "role": "farmer"
    }
    login_res = client.post("/login", json=login_payload)
    assert login_res.status_code == 200, login_res.text
    token_data = login_res.json()
    assert "access_token" in token_data

    # Verify /me endpoint returns role='farmer'
    me_res = client.get("/me", headers={"Authorization": f"Bearer {token_data['access_token']}"})
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["role"] == "farmer"
    assert me_data["email"] == email


def test_admin_login(client):
    """Test 2 — Admin login: valid admin credentials return role='admin'."""
    from app.database import SessionLocal
    from app.models import User, UserRole, Language
    db = SessionLocal()
    try:
        lang = db.query(Language).first()
        admin = db.query(User).filter_by(email="admin_role_test@example.com").first()
        if not admin:
            admin = User(
                username="Admin Tester",
                email="admin_role_test@example.com",
                hashed_password=get_password_hash("AdminPass123!"),
                role=UserRole.ADMIN.value,
                status="active",
                language_id=lang.id if lang else 1
            )
            db.add(admin)
            db.commit()
    finally:
        db.close()

    # Login via Admin Login
    login_res = client.post("/admin/login", json={
        "email": "admin_role_test@example.com",
        "password": "AdminPass123!",
        "role": "admin"
    })
    assert login_res.status_code == 200, login_res.text
    token_data = login_res.json()
    assert "access_token" in token_data

    me_res = client.get("/me", headers={"Authorization": f"Bearer {token_data['access_token']}"})
    assert me_res.status_code == 200
    assert me_res.json()["role"] == "admin"


def test_admin_credentials_in_farmer_login(client):
    """Test 3 — Admin credentials entered in Farmer login must be rejected with HTTP 403."""
    login_res = client.post("/login", json={
        "email": "admin_role_test@example.com",
        "password": "AdminPass123!",
        "role": "farmer"
    })
    assert login_res.status_code == 403
    detail = login_res.json().get("detail", "")
    assert "This account is not registered as a Farmer" in detail


def test_farmer_credentials_in_admin_login(client):
    """Test 4 — Farmer credentials entered in Admin login must be rejected with HTTP 403."""
    login_res = client.post("/admin/login", json={
        "email": "testfarmer1@example.com",
        "password": "Password123!",
        "role": "admin"
    })
    assert login_res.status_code == 403
    detail = login_res.json().get("detail", "")
    assert "This account is not registered as an Admin" in detail


def test_admin_user_management_endpoint(client):
    """Test 5 — User Management API returns real DB users for Admin and rejects non-Admin."""
    admin_login_res = client.post("/admin/login", json={
        "email": "admin_role_test@example.com",
        "password": "AdminPass123!"
    })
    admin_token = admin_login_res.json()["access_token"]

    users_res = client.get("/admin/users", headers={"Authorization": f"Bearer {admin_token}"})
    assert users_res.status_code == 200
    users_list = users_res.json()
    assert isinstance(users_list, list)
    emails = [u["email"] for u in users_list]
    assert "testfarmer1@example.com" in emails
    assert "admin_role_test@example.com" in emails

    farmer_login_res = client.post("/login", json={
        "email": "testfarmer1@example.com",
        "password": "Password123!"
    })
    farmer_token = farmer_login_res.json()["access_token"]
    forbidden_res = client.get("/admin/users", headers={"Authorization": f"Bearer {farmer_token}"})
    assert forbidden_res.status_code == 403


def test_farmer_data_isolation(client):
    """Test 6 — Farmer A data must NOT be accessible by Farmer B."""
    from app.database import SessionLocal
    from app.models import User, PredictionHistory, Language
    db = SessionLocal()
    try:
        lang = db.query(Language).first()
        f_a = db.query(User).filter_by(email="farmer_a@example.com").first()
        if not f_a:
            f_a = User(username="FarmerA", email="farmer_a@example.com", hashed_password=get_password_hash("Pass123!"), role="farmer", language_id=lang.id)
            db.add(f_a)
            db.commit()
            db.refresh(f_a)

        f_b = db.query(User).filter_by(email="farmer_b@example.com").first()
        if not f_b:
            f_b = User(username="FarmerB", email="farmer_b@example.com", hashed_password=get_password_hash("Pass123!"), role="farmer", language_id=lang.id)
            db.add(f_b)
            db.commit()
            db.refresh(f_b)

        pred = db.query(PredictionHistory).filter_by(user_id=f_a.id).first()
        if not pred:
            pred = PredictionHistory(
                user_id=f_a.id,
                soil_image_path="uploads/test.jpg",
                soil_type="Loamy",
                soil_confidence=0.92,
                nitrogen=40.0,
                phosphorus=20.0,
                potassium=30.0,
                ph=6.5,
                organic_carbon=0.5,
                electrical_conductivity=1.2,
                temperature=25.0,
                humidity=60.0,
                soil_health="Good",
                soil_health_score=85.0,
                soil_fertility_status="High",
                nutrient_deficiencies=["Nitrogen"],
                recommended_crops=["Wheat"],
                recommended_fertilizers=["Urea"]
            )
            db.add(pred)
            db.commit()
            db.refresh(pred)
        pred_id = pred.id
    finally:
        db.close()

    t_a = client.post("/login", json={"email": "farmer_a@example.com", "password": "Pass123!"}).json()["access_token"]
    res_a = client.get("/history", headers={"Authorization": f"Bearer {t_a}"})
    assert res_a.status_code == 200
    assert len(res_a.json()) >= 1

    t_b = client.post("/login", json={"email": "farmer_b@example.com", "password": "Pass123!"}).json()["access_token"]
    res_b = client.get("/history", headers={"Authorization": f"Bearer {t_b}"})
    assert res_b.status_code == 200
    history_b = res_b.json()
    history_b_ids = [item["history_id"] for item in history_b]
    assert pred_id not in history_b_ids


def test_token_identity(client):
    """Test 7 — Token claims contain actual user_id and role."""
    login_res = client.post("/login", json={
        "email": "testfarmer1@example.com",
        "password": "Password123!"
    })
    token = login_res.json()["access_token"]
    payload = decode_token(token, settings.JWT_SECRET_KEY)
    assert payload is not None
    assert payload["email"] == "testfarmer1@example.com"
    assert payload["role"] == "farmer"
    assert "user_id" in payload
