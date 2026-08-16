import os
import uuid
import pytest
from datetime import datetime
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app.database import SessionLocal
import io
from PIL import Image
from app.models import User, GeneralHistory, ChatHistory, PredictionHistory



@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="module")
def unique_email():
    return f"historytest_{uuid.uuid4().hex[:8]}@test.com"


@pytest.fixture(scope="module")
def unique_username():
    return f"farmer_{uuid.uuid4().hex[:8]}"


def test_complete_global_history_workflow(client, unique_email, unique_username):
    # 1. Registration
    reg_payload = {
        "email": unique_email,
        "password": "Password123!",
        "confirm_password": "Password123!",
        "username": unique_username,
        "role": "farmer",
        "language_id": 1,
        "region": "Central"
    }
    res_reg = client.post("/register", json=reg_payload)
    assert res_reg.status_code == 201

    # 2. Login
    login_payload = {
        "email": unique_email,
        "password": "Password123!"
    }
    # Pass headers to simulate browser user-agent
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/115.0.0.0 Safari/537.36"}
    res_login = client.post("/login", json=login_payload, headers=headers)
    assert res_login.status_code == 200
    tokens = res_login.json()
    auth_headers = {"Authorization": f"Bearer {tokens['access_token']}"}

    # Verify login activity was saved to GeneralHistory
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == unique_email).first()
        assert user is not None
        user_id = user.id
        
        login_acts = db.query(GeneralHistory).filter(
            GeneralHistory.user_id == user_id,
            GeneralHistory.prediction_type == "login_activity"
        ).all()
        assert len(login_acts) >= 1
        assert login_acts[0].input_parameters["browser"] in ["Chrome", "Desktop Browser"]
        assert login_acts[0].input_parameters["device"] in ["Windows PC", "Desktop"]
    finally:
        db.close()

    # 3. Change Language and Edit Profile
    profile_payload = {
        "email": unique_email,
        "language_id": 2,  # Change to Hindi
        "username": unique_username + "_edited",
        "region": "North Region",
        "mobile": "9876543210",
        "address": "Farm House 10",
        "district": "Amritsar",
        "state": "Punjab",
        "community": "Wheat"
    }
    res_profile = client.put("/me", json=profile_payload, headers=auth_headers)
    assert res_profile.status_code == 200

    # Verify profile changes logged in GeneralHistory
    db = SessionLocal()
    try:
        profile_logs = db.query(GeneralHistory).filter(
            GeneralHistory.user_id == user_id,
            GeneralHistory.prediction_type == "profile"
        ).all()
        assert len(profile_logs) >= 1
        
        # Verify community action logged
        comm_logs = db.query(GeneralHistory).filter(
            GeneralHistory.user_id == user_id,
            GeneralHistory.prediction_type == "community"
        ).all()
        assert len(comm_logs) >= 1
        assert comm_logs[0].input_parameters["field"] == "Community"
    finally:
        db.close()

    # 4. Crop Recommendation
    crop_payload = {
        "soil_type": "Clayey",
        "nitrogen": 70.0,
        "phosphorus": 40.0,
        "potassium": 45.0,
        "ph": 6.2,
        "organic_carbon": 0.55,
        "electrical_conductivity": 0.35,
        "temperature": 28.0,
        "humidity": 65.0
    }
    res_crop = client.post("/recommend-crop", json=crop_payload, headers=auth_headers)
    assert res_crop.status_code == 200

    # 5. Fertilizer Recommendation
    fert_payload = {
        "soil_type": "Clayey",
        "nitrogen": 70.0,
        "phosphorus": 40.0,
        "potassium": 45.0,
        "ph": 6.2,
        "organic_carbon": 0.55,
        "electrical_conductivity": 0.35,
        "temperature": 28.0,
        "humidity": 65.0
    }
    res_fert = client.post("/recommend-fertilizer", json=fert_payload, headers=auth_headers)
    assert res_fert.status_code == 200

    # 6. Disease Detection
    buf = io.BytesIO()
    import random
    image = Image.new("RGB", (224, 224))
    pixels = image.load()
    for x in range(224):
        for y in range(224):
            r = random.randint(60, 190)
            g = random.randint(60, 190)
            b = random.randint(60, 190)
            pixels[x, y] = (r, g, b)
    image.save(buf, format="PNG")
    dummy_image = buf.getvalue()
    files = {"file": ("leaf.png", dummy_image, "image/png")}
    res_disease = client.post("/predict-disease", files=files, headers=auth_headers)
    assert res_disease.status_code == 200

    # 7. Weather Forecast Lookup
    res_weather = client.get("/weather/forecast?location=Amritsar", headers=auth_headers)
    assert res_weather.status_code == 200

    # 8. AI Chatbot interaction
    chat_payload = {
        "question": "How do I optimize wheat crop yield in Punjab?",
        "preferred_language": "English"
    }
    res_chat = client.post("/chat", json=chat_payload, headers=auth_headers)
    assert res_chat.status_code == 200

    # 9. PDF Report Generation
    res_pdf = client.get(f"/api/generate-pdf-report?language_code=en&farmer_name={unique_username}&soil_type=Loamy", headers=auth_headers)
    assert res_pdf.status_code == 200

    # 10. Logout and Login Again to verify persistence and logout session duration calculation
    res_logout = client.post("/logout", headers=auth_headers)
    assert res_logout.status_code == 200

    # Verify logout time and session duration are recorded
    db = SessionLocal()
    try:
        latest_login = db.query(GeneralHistory).filter(
            GeneralHistory.user_id == user_id,
            GeneralHistory.prediction_type == "login_activity"
        ).order_by(GeneralHistory.created_at.desc()).first()
        assert latest_login is not None
        assert latest_login.prediction_result["logout_time"] is not None
        assert latest_login.prediction_result["session_duration"] is not None
    finally:
        db.close()

    # Login Again
    res_login_again = client.post("/login", json=login_payload, headers=headers)
    assert res_login_again.status_code == 200
    tokens_again = res_login_again.json()
    auth_headers_again = {"Authorization": f"Bearer {tokens_again['access_token']}"}

    # 11. Retrieve and verify history endpoint with search, filtering, and pagination
    res_history = client.get("/history", headers=auth_headers_again)
    assert res_history.status_code == 200
    history_items = res_history.json()
    assert len(history_items) > 0

    # Filter by category
    res_crop_history = client.get("/history?category=crop", headers=auth_headers_again)
    assert res_crop_history.status_code == 200
    assert all(item["prediction_type"] == "crop" for item in res_crop_history.json())

    # Search query
    res_search_history = client.get("/history?search=Amritsar", headers=auth_headers_again)
    assert res_search_history.status_code == 200

    # Pagination metadata headers checking
    assert "X-Total-Count" in res_history.headers
    assert "X-Total-Pages" in res_history.headers
    assert int(res_history.headers["X-Current-Page"]) == 1

    # 12. Deletion
    first_item_id = history_items[0]["history_id"]
    res_delete = client.delete(f"/history/{first_item_id}", headers=auth_headers_again)
    assert res_delete.status_code == 200

    # Verify deletion in DB
    db = SessionLocal()
    try:
        deleted_record = get_prediction_history_by_id(db, user_id, first_item_id)
        assert deleted_record is None
    finally:
        db.close()


def get_prediction_history_by_id(db: Session, user_id: int, history_id: int):
    if history_id >= 20000:
        return db.query(ChatHistory).filter(ChatHistory.id == history_id - 20000, ChatHistory.user_id == user_id).first()
    elif history_id >= 10000:
        return db.query(GeneralHistory).filter(GeneralHistory.id == history_id - 10000, GeneralHistory.user_id == user_id).first()
    else:
        return db.query(PredictionHistory).filter(PredictionHistory.id == history_id, PredictionHistory.user_id == user_id).first()
