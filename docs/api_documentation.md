# AgroAI REST API Documentation

This document describes the key REST endpoints exposed by the backend FastAPI server.

---

## 1. Authentication Endpoints

### `POST /register`
* **Description**: Create a new farmer or admin account.
* **Payload**:
  ```json
  {
    "username": "FarmerName",
    "email": "farmer@test.com",
    "password": "Password123!",
    "confirm_password": "Password123!",
    "role": "farmer",
    "region": "Punjab",
    "language_id": 1
  }
  ```
* **Response**: `HTTP 201 Created`

### `POST /login`
* **Description**: Authenticate credentials and return JWT bearer tokens.
* **Response**:
  ```json
  {
    "access_token": "eyJhbG...",
    "refresh_token": "eyJhbG...",
    "token_type": "Bearer"
  }
  ```

---

## 2. Agronomic & ML Inference Endpoints

### `POST /predict-image`
* **Description**: Upload soil sample image to classify classes using EfficientNet-B0.
* **Response**:
  ```json
  {
    "soil_type": "Clayey",
    "confidence": 98.2,
    "canonical_soil_type": "Clayey",
    "probabilities": {"Clayey": 98.2, "Loamy": 1.1}
  }
  ```

### `POST /recommend-crop`
* **Description**: Generate crop recommendation lists from NPK, pH, and weather values.
* **Response**:
  ```json
  {
    "recommended_crop": "Wheat",
    "confidence": 96.0,
    "recommended_crops": [
      {"crop": "Wheat", "score": 96.0},
      {"crop": "Barley", "score": 75.0}
    ]
  }
  ```

---

## 3. General Health & Utility

### `GET /health`
* **Description**: Returns server component statuses.
* **Response**: `{"status": "healthy", "service": "AgroAI API"}`
