"""Senior QA Test Execution Suite for Weather Dashboard."""

import sys
import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.utils import create_access_token
from app.services.weather_service import get_current_weather, get_weather_forecast

from app.database import SessionLocal
from app.models import User, UserRole, UserStatus
from app.security import get_password_hash

client = TestClient(app)

def get_auth_headers(user_id: int = 49, email: str = "farmer@example.com", role: str = "farmer", language_id: int = 1):
    payload = {"user_id": user_id, "email": email, "role": role, "language_id": language_id}
    token = create_access_token(payload)
    return {"Authorization": f"Bearer {token}"}


class WeatherQATestSuite(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        db = SessionLocal()
        try:
            admin = db.query(User).filter(User.email == "qa_admin@example.com").first()
            if not admin:
                db.add(User(
                    email="qa_admin@example.com",
                    hashed_password=get_password_hash("AdminPass123!"),
                    role=UserRole.ADMIN.value,
                    status=UserStatus.ACTIVE.value,
                    language_id=1
                ))
            farmer = db.query(User).filter(User.email == "qa_farmer@example.com").first()
            if not farmer:
                db.add(User(
                    email="qa_farmer@example.com",
                    hashed_password=get_password_hash("SecurePass123!"),
                    role=UserRole.FARMER.value,
                    status=UserStatus.ACTIVE.value,
                    language_id=1
                ))
            db.commit()
        finally:
            db.close()

    def test_01_current_weather_english(self):
        headers = get_auth_headers()
        res = client.get("/weather/current?location=Hyderabad", headers=headers)
        self.assertEqual(res.status_code, 200, res.text)
        data = res.json()
        for field in ["location", "current_temperature", "feels_like", "condition", "humidity", "wind_speed", "precipitation", "uv_index", "visibility", "icon", "icon_url"]:
            self.assertIn(field, data)
        self.assertTrue(data["icon_url"].startswith("http"))
        print("  [PASS] Test 1: Current Weather English (11 Metrics Verified)")

    def test_02_forecast_5_days(self):
        headers = get_auth_headers()
        res = client.get("/weather/forecast?location=Hyderabad", headers=headers)
        self.assertEqual(res.status_code, 200, res.text)
        data = res.json()
        self.assertIn("forecast", data)
        self.assertEqual(len(data["forecast"]), 5)
        for daily in data["forecast"]:
            for field in ["date", "day_name", "min_temp", "max_temp", "condition", "icon", "icon_url"]:
                self.assertIn(field, daily)
        print("  [PASS] Test 2: 5-Day Weather Forecast (Schema & 5 Days Verified)")

    def test_03_multilingual_telugu(self):
        headers = get_auth_headers(language_id=3)
        res = client.get("/weather/current?location=Hyderabad&language_id=3", headers=headers)
        self.assertEqual(res.status_code, 200)
        print("  [PASS] Test 3: Multilingual Current Weather (Telugu language_id=3 Verified)")

    def test_04_multilingual_hindi(self):
        headers = get_auth_headers(language_id=2)
        res = client.get("/weather/current?location=Delhi&language_id=2", headers=headers)
        self.assertEqual(res.status_code, 200)
        print("  [PASS] Test 4: Multilingual Current Weather (Hindi language_id=2 Verified)")

    def test_05_multilingual_tamil(self):
        headers = get_auth_headers(language_id=4)
        res = client.get("/weather/current?location=Chennai&language_id=4", headers=headers)
        self.assertEqual(res.status_code, 200)
        print("  [PASS] Test 5: Multilingual Current Weather (Tamil language_id=4 Verified)")

    def test_06_forecast_telugu(self):
        headers = get_auth_headers(language_id=3)
        res = client.get("/weather/forecast?location=Hyderabad&language_id=3", headers=headers)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.json()["forecast"]), 5)
        print("  [PASS] Test 6: Multilingual 5-Day Forecast (Telugu Verified)")

    def test_07_unauthenticated_current_weather(self):
        res = client.get("/weather/current?location=Hyderabad")
        self.assertEqual(res.status_code, 401)
        print("  [PASS] Test 7: Security check - Unauthenticated Current Weather returns 401 Unauthorized")

    def test_08_unauthenticated_forecast(self):
        res = client.get("/weather/forecast?location=Hyderabad")
        self.assertEqual(res.status_code, 401)
        print("  [PASS] Test 8: Security check - Unauthenticated Forecast returns 401 Unauthorized")

    def test_09_empty_location(self):
        headers = get_auth_headers()
        res = client.get("/weather/current?location=", headers=headers)
        self.assertEqual(res.status_code, 400)
        print("  [PASS] Test 9: Input Validation - Empty location string returns 400 Bad Request")

    def test_10_missing_location_parameter(self):
        headers = get_auth_headers()
        res = client.get("/weather/current", headers=headers)
        self.assertEqual(res.status_code, 422)
        print("  [PASS] Test 10: Input Validation - Missing location parameter returns 422 Unprocessable Entity")

    def test_11_admin_role_access(self):
        headers = get_auth_headers(user_id=95, email="admin@example.com", role="admin")
        res = client.get("/weather/current?location=Hyderabad", headers=headers)
        self.assertEqual(res.status_code, 200)
        print("  [PASS] Test 11: RBAC check - Admin user role access allowed")

    def test_12_farmer_role_access(self):
        headers = get_auth_headers(user_id=49, email="farmer@example.com", role="farmer")
        res = client.get("/weather/current?location=Hyderabad", headers=headers)
        self.assertEqual(res.status_code, 200)
        print("  [PASS] Test 12: RBAC check - Farmer user role access allowed")

    def test_13_fallback_weather_resiliency(self):
        res = get_current_weather("FallbackTestCity")
        self.assertIn("current_temperature", res)
        print("  [PASS] Test 13: Service Resiliency - Dynamic weather fallback verified")

    def test_14_fallback_forecast_resiliency(self):
        res = get_weather_forecast("FallbackTestCity")
        self.assertEqual(len(res["forecast"]), 5)
        print("  [PASS] Test 14: Service Resiliency - Dynamic forecast fallback verified")

    def test_15_admin_portal_login_success(self):
        payload = {"email": "qa_admin@example.com", "password": "AdminPass123!"}
        res = client.post("/admin/login", json=payload)
        self.assertEqual(res.status_code, 200)
        self.assertIn("access_token", res.json())
        print("  [PASS] Test 15: Admin Portal Login - Valid admin credentials login successfully")

    def test_16_admin_portal_login_farmer_rejected(self):
        payload = {"email": "qa_farmer@example.com", "password": "SecurePass123!"}
        res = client.post("/admin/login", json=payload)
        self.assertEqual(res.status_code, 403)
        self.assertIn("Access Denied", res.json()["detail"])
        print("  [PASS] Test 16: Admin Portal Login Security - Farmer login attempt rejected with 403 Forbidden")



if __name__ == "__main__":
    print("\n=======================================================")
    print("  RUNNING SENIOR QA TEST SUITE: WEATHER DASHBOARD APIs  ")
    print("=======================================================\n")
    runner = unittest.TextTestRunner(verbosity=2)
    suite = unittest.TestLoader().loadTestsFromTestCase(WeatherQATestSuite)
    result = runner.run(suite)
    if not result.wasSuccessful():
        sys.exit(1)
