"""Comprehensive Senior QA Test Suite for Weather Dashboard APIs."""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.utils import create_access_token
from app.services.weather_service import get_current_weather, get_weather_forecast

client = TestClient(app)

# Helper token generator
def get_auth_headers(user_id: int = 49, email: str = "farmer@example.com", role: str = "farmer", language_id: int = 1):
    payload = {"user_id": user_id, "email": email, "role": role, "language_id": language_id}
    token = create_access_token(payload)
    return {"Authorization": f"Bearer {token}"}


class TestWeatherCurrentAPI:
    """QA Test Suite for Current Weather Endpoint (GET /weather/current)."""

    def test_current_weather_success_english(self):
        headers = get_auth_headers()
        response = client.get("/weather/current?location=Hyderabad", headers=headers)
        assert response.status_code == 200, response.text
        data = response.json()
        
        # Verify mandatory field structure
        assert "location" in data
        assert "current_temperature" in data
        assert "feels_like" in data
        assert "condition" in data
        assert "humidity" in data
        assert "wind_speed" in data
        assert "precipitation" in data
        assert "uv_index" in data
        assert "visibility" in data
        assert "icon" in data
        assert "icon_url" in data
        
        # Data type assertions
        assert isinstance(data["current_temperature"], (int, float))
        assert isinstance(data["humidity"], int)
        assert data["icon_url"].startswith("http")

    def test_current_weather_telugu_multilingual(self):
        headers = get_auth_headers(language_id=3)
        response = client.get("/weather/current?location=Hyderabad&language_id=3", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["location"] is not None
        assert data["condition"] is not None

    def test_current_weather_hindi_multilingual(self):
        headers = get_auth_headers(language_id=2)
        response = client.get("/weather/current?location=Delhi&language_id=2", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["location"] is not None

    def test_current_weather_tamil_multilingual(self):
        headers = get_auth_headers(language_id=4)
        response = client.get("/weather/current?location=Chennai&language_id=4", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["location"] is not None

    def test_current_weather_unauthenticated_fails(self):
        response = client.get("/weather/current?location=Hyderabad")
        assert response.status_code == 401

    def test_current_weather_empty_location_fails(self):
        headers = get_auth_headers()
        response = client.get("/weather/current?location=", headers=headers)
        assert response.status_code == 400

    def test_current_weather_missing_location_param_fails(self):
        headers = get_auth_headers()
        response = client.get("/weather/current", headers=headers)
        assert response.status_code == 422


class TestWeatherForecastAPI:
    """QA Test Suite for 5-Day Weather Forecast Endpoint (GET /weather/forecast)."""

    def test_forecast_success_5_days(self):
        headers = get_auth_headers()
        response = client.get("/weather/forecast?location=Hyderabad", headers=headers)
        assert response.status_code == 200, response.text
        data = response.json()
        
        assert "location" in data
        assert "forecast" in data
        assert isinstance(data["forecast"], list)
        assert len(data["forecast"]) == 5

        # Verify daily item schema
        daily = data["forecast"][0]
        assert "date" in daily
        assert "day_name" in daily
        assert "min_temp" in daily
        assert "max_temp" in daily
        assert "condition" in daily
        assert "icon" in daily
        assert "icon_url" in daily

    def test_forecast_multilingual_telugu(self):
        headers = get_auth_headers(language_id=3)
        response = client.get("/weather/forecast?location=Hyderabad&language_id=3", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data["forecast"]) == 5

    def test_forecast_unauthenticated_fails(self):
        response = client.get("/weather/forecast?location=Hyderabad")
        assert response.status_code == 401

    def test_forecast_empty_location_fails(self):
        headers = get_auth_headers()
        response = client.get("/weather/forecast?location=", headers=headers)
        assert response.status_code == 400


class TestWeatherRBACPermissions:
    """QA Test Suite for Role-Based Access Control on Weather APIs."""

    def test_admin_access_allowed(self):
        headers = get_auth_headers(user_id=95, email="admin@example.com", role="admin")
        response = client.get("/weather/current?location=Hyderabad", headers=headers)
        assert response.status_code == 200

    def test_farmer_access_allowed(self):
        headers = get_auth_headers(user_id=49, email="farmer@example.com", role="farmer")
        response = client.get("/weather/current?location=Hyderabad", headers=headers)
        assert response.status_code == 200


class TestWeatherServiceFallback:
    """QA Test Suite for Service-level dynamic fallback resiliency."""

    def test_service_current_weather_fallback(self):
        res = get_current_weather("UnknownCityXYZ")
        assert res["current_temperature"] > -50.0
        assert res["humidity"] >= 0
        assert "icon_url" in res

    def test_service_forecast_fallback(self):
        res = get_weather_forecast("UnknownCityXYZ")
        assert len(res["forecast"]) == 5
