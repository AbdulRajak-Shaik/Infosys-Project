import io
import uuid
import pytest
from fastapi.testclient import TestClient
from PIL import Image
from app.main import app
from app.database import SessionLocal
from app.models import User, PredictionHistory

client = TestClient(app)

# Unique per-process email so parallel pytest invocations don't collide
_TEST_EMAIL = f"integrationtest_{uuid.uuid4().hex[:8]}@test.com"


def cleanup_test_user(email: str = _TEST_EMAIL):
    print(f"[CLEANUP] Starting cleanup_test_user for {email}...")
    db = SessionLocal()
    try:
        print("[CLEANUP] Querying for user...")
        user = db.query(User).filter(User.email == email).first()
        if user:
            print("[CLEANUP] User found. Deleting related records...")
            db.query(PredictionHistory).filter(PredictionHistory.user_id == user.id).delete(synchronize_session=False)
            # Also remove GeneralHistory and ChatHistory if models are present
            try:
                from app.models import GeneralHistory
                db.query(GeneralHistory).filter(GeneralHistory.user_id == user.id).delete(synchronize_session=False)
            except Exception:
                pass
            try:
                from app.models import ChatHistory
                db.query(ChatHistory).filter(ChatHistory.user_id == user.id).delete(synchronize_session=False)
            except Exception:
                pass
            print("[CLEANUP] Deleting user...")
            db.delete(user)
            print("[CLEANUP] Committing changes...")
            db.commit()
            print("[CLEANUP] Changes committed successfully.")
        else:
            print("[CLEANUP] No test user found to clean up.")
    except Exception as e:
        print("[CLEANUP] Error during cleanup:", e)
        db.rollback()
    finally:
        db.close()
        print("[CLEANUP] DB session closed.")


@pytest.fixture(autouse=True)
def run_around_tests():
    print("[FIXTURE] Before yield: running cleanup...")
    cleanup_test_user()
    print("[FIXTURE] Yielding to test...")
    yield
    print("[FIXTURE] After yield: running cleanup...")
    cleanup_test_user()


def get_dummy_image():
    file = io.BytesIO()
    import random
    image = Image.new("RGB", (224, 224))
    pixels = image.load()
    for x in range(224):
        for y in range(224):
            r = random.randint(60, 190)
            g = random.randint(60, 190)
            b = random.randint(60, 190)
            pixels[x, y] = (r, g, b)
    image.save(file, "JPEG")
    file.seek(0)
    return file


def test_full_api_integration_flow():
    # 1. Registration
    print("STEP 1: Registration")
    reg_payload = {
        "username": "Integration Test Farmer",
        "email": _TEST_EMAIL,
        "password": "Password123!",
        "confirm_password": "Password123!",
        "role": "farmer",
        "region": "Punjab",
        "language_id": 1
    }
    reg_resp = client.post("/register", json=reg_payload)
    assert reg_resp.status_code == 201

    # 2. Login
    print("STEP 2: Login")
    login_resp = client.post("/login", json={
        "email": _TEST_EMAIL,
        "password": "Password123!"
    })
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Profile /me GET
    print("STEP 3: Profile GET")
    me_resp = client.get("/me", headers=headers)
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == _TEST_EMAIL

    # 4. Profile /me PUT
    print("STEP 4: Profile PUT")
    update_resp = client.put("/me", json={
        "email": _TEST_EMAIL,
        "username": "Updated Farmer Name",
        "language_id": 1,
        "region": "Haryana"
    }, headers=headers)
    assert update_resp.status_code == 200
    assert update_resp.json()["username"] == "Updated Farmer Name"

    # 5. Soil Classification POST /predict
    print("STEP 5: Soil Classification predict")
    img_file = get_dummy_image()
    files = {"file": ("test_soil.jpg", img_file, "image/jpeg")}
    predict_resp = client.post("/predict", files=files, headers=headers)
    assert predict_resp.status_code == 200
    predict_json = predict_resp.json()
    assert "soil_type" in predict_json
    assert "confidence" in predict_json

    # 6. Crop Recommendation POST /recommend-crop
    print("STEP 6: Crop Recommendation")
    crop_payload = {
        "soil_type": "Clayey",
        "nitrogen": 90.0,
        "phosphorus": 42.0,
        "potassium": 43.0,
        "ph": 6.5,
        "organic_carbon": 0.5,
        "electrical_conductivity": 1.0,
        "temperature": 28.5,
        "humidity": 65.0
    }
    crop_resp = client.post("/recommend-crop", json=crop_payload, headers=headers)
    assert crop_resp.status_code == 200
    crop_json = crop_resp.json()
    assert "recommended_crops" in crop_json or "recommended_crop" in crop_json

    # 7. Soil Health Score POST /soil-health-score
    print("STEP 7: Soil Health Score")
    health_payload = {
        "soil_type": "Clayey",
        "nitrogen": 90.0,
        "phosphorus": 42.0,
        "potassium": 43.0,
        "ph": 6.5,
        "organic_carbon": 0.5,
        "electrical_conductivity": 1.0,
        "temperature": 28.5,
        "humidity": 65.0
    }
    health_resp = client.post("/soil-health-score", json=health_payload, headers=headers)
    assert health_resp.status_code == 200
    health_json = health_resp.json()
    assert "soil_health_score" in health_json

    # 8. Final Recommendation POST /final-recommendation (FormData)
    print("STEP 8: Final Recommendation")
    img_file_2 = get_dummy_image()
    data = {
        "nitrogen": "90.0",
        "phosphorus": "42.0",
        "potassium": "43.0",
        "ph": "6.5",
        "organic_carbon": "0.5",
        "electrical_conductivity": "1.0",
        "location": "Hyderabad"
    }
    files_2 = {"image": ("test_soil_final.jpg", img_file_2, "image/jpeg")}
    final_resp = client.post("/final-recommendation", data=data, files=files_2, headers=headers)
    assert final_resp.status_code == 200
    final_json = final_resp.json()
    assert "soil_type" in final_json
    assert "soil_health_score" in final_json

    # 9. History GET /history — at least one entry must exist from earlier steps
    print("STEP 9: Prediction History")
    history_resp = client.get("/history", headers=headers)
    assert history_resp.status_code == 200
    history_json = history_resp.json()
    assert len(history_json) >= 1

    # 10. Analytics GET /analytics
    print("STEP 10: Analytics")
    analytics_resp = client.get("/analytics", headers=headers)
    assert analytics_resp.status_code == 200
    analytics_json = analytics_resp.json()
    assert "total_predictions" in analytics_json

    # 11. Notifications GET /notifications
    print("STEP 11: Notifications")
    notif_resp = client.get("/notifications", headers=headers)
    assert notif_resp.status_code == 200

    # 12. Health Check GET /health
    print("STEP 12: Health Check")
    health_resp = client.get("/health")
    assert health_resp.status_code == 200
    assert health_resp.json()["status"] == "healthy"
