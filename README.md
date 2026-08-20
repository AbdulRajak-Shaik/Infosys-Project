# 🌱 AgroAI — AI-Based Soil Health Assessment System

An enterprise-grade, fullstack agricultural intelligence platform that assesses soil health, detects macro/micro-nutrient deficiencies via computer vision, recommends optimal crops and fertilizer schedules, provides hyper-local weather analytics, and assists farmers in regional Indian languages through an AI-powered multilingual chatbot.

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Local Setup](#-local-setup)
- [Environment Variables](#-environment-variables)
- [Running the Application](#-running-the-application)
- [API Documentation](#-api-documentation)
- [Authentication](#-authentication)
- [Default Login Credentials](#-default-login-credentials)
- [Deployment on Render](#-deployment-on-render)
- [Database Notes](#-database-notes)
- [Development Notes](#-development-notes)

---

## 🌾 Overview

AgroAI is a unified fullstack application that serves farmers, agronomists, and agricultural administrators through an intelligent soil health assessment platform. It combines computer vision, agronomic rule-based scoring, multilingual NLP, and real-time weather data to deliver actionable farm insights.

**Live Demo**: [https://infosys-project-h85u.onrender.com](https://infosys-project-h85u.onrender.com)

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🔬 **Soil Classification** | CNN-based image classification (ResNet/EfficientNet) identifies soil type from images |
| 🌿 **Crop Recommendation** | Agronomic scoring engine recommends top 5 crops based on N, P, K, pH, temperature, humidity |
| 💊 **Nutrient Deficiency Detection** | ML model identifies macro/micro nutrient deficiencies |
| 🌱 **Fertilizer Advisory** | Customized fertilizer schedules based on detected deficiencies |
| 🏥 **Soil Health Scoring** | Generates a 0–100 soil health index |
| 🤖 **AI Chatbot** | Gemini-powered multilingual agricultural assistant |
| 🌦️ **Weather Intelligence** | Real-time hyper-local weather via OpenWeatherMap |
| 🗣️ **Multilingual Support** | Telugu, Hindi, English support via Sarvam AI |
| 📊 **Admin Dashboard** | Platform analytics, user management, prediction history |
| 🔔 **Notifications** | Real-time alerts and prediction history for farmers |
| 📄 **PDF Reports** | Downloadable multilingual soil health reports |

---

## 🛠️ Tech Stack

### Backend
- **FastAPI** — High-performance Python web framework
- **SQLAlchemy** — ORM for database interactions
- **SQLite** (dev) / **PostgreSQL** (production) — Database
- **JWT (python-jose)** — Authentication & authorization
- **Celery + Redis** — Async task queue (optional)
- **Uvicorn** — ASGI server

### Frontend
- **React 18** + **TypeScript** — UI framework
- **Vite** — Build tool
- **TailwindCSS** — Styling
- **React Context** — State management
- **i18n** — Internationalization

### AI / ML
- **Scikit-learn / CatBoost** — ML models for nutrient and soil analysis
- **EfficientNetB0 / ResNet-50** — CNN for soil image classification
- **Google Gemini AI** — LLM for agricultural chatbot
- **Sarvam AI** — Indian language translation and TTS

---

## 📁 Project Structure

```
project-root/
│
├── app/                          # FastAPI backend application
│   ├── routes/                   # All API route handlers (20 modules)
│   │   ├── auth_routes.py        # Login, register, refresh token
│   │   ├── prediction_routes.py  # Soil image classification
│   │   ├── crop_routes.py        # Crop recommendation
│   │   ├── nutrient_routes.py    # Nutrient deficiency detection
│   │   ├── soil_health_routes.py # Soil health analysis
│   │   ├── weather_routes.py     # Weather data
│   │   ├── chat_routes.py        # AI chatbot
│   │   ├── admin_dashboard.py    # Admin analytics
│   │   ├── feedback_routes.py    # User feedback
│   │   ├── history_routes.py     # Prediction history
│   │   └── ...                   # Other route modules
│   │
│   ├── services/                 # Business logic layer (23 modules)
│   │   ├── crop_service.py       # Agronomic crop scoring engine
│   │   ├── image_service.py      # CNN image prediction
│   │   ├── gemini_service.py     # Google Gemini AI chatbot
│   │   ├── sarvam_service.py     # Multilingual translation
│   │   ├── weather_service.py    # OpenWeatherMap integration
│   │   ├── nutrient_service.py   # Nutrient analysis
│   │   └── ...                   # Other service modules
│   │
│   ├── ml_models/                # Pre-trained ML model files
│   │   ├── soil_health_class_model.pkl     # Soil image classification
│   │   ├── soil_health_score_model.pkl     # Soil health scoring
│   │   ├── nutrient_deficiency_model.pkl   # Nutrient detection
│   │   ├── soil_fertility_model.pkl        # Fertility assessment
│   │   ├── crop_recommendation_model.pkl   # Legacy crop model
│   │   ├── label_encoders.pkl              # Label encoders
│   │   ├── feature_meta.pkl                # Feature metadata
│   │   └── class_names.json                # Soil class labels
│   │
│   ├── tasks/                    # Celery async task definitions
│   ├── uploads/                  # Runtime image uploads (gitignored)
│   ├── main.py                   # Application entry point + router registration
│   ├── models.py                 # SQLAlchemy database models
│   ├── schemas.py                # Pydantic request/response schemas
│   ├── database.py               # Database engine configuration
│   ├── auth.py                   # JWT authentication logic
│   ├── config.py                 # App settings from environment
│   ├── dependencies.py           # FastAPI dependency injection
│   ├── security.py               # Token generation utilities
│   ├── image_preprocessing.py    # Image preprocessing for ML
│   ├── utils.py                  # Shared utility functions
│   ├── celery_app.py             # Celery task queue setup
│   └── task_metadata.py          # Task metadata helpers
│
├── AI-Based-...-frontend-team-1/ # React frontend source
│   ├── src/
│   │   ├── pages/                # All page components
│   │   │   ├── AIModules.tsx     # Soil classification + crop recommendation
│   │   │   ├── FarmerDashboard.tsx
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── AIChatbot.tsx
│   │   │   └── ...
│   │   ├── components/           # Reusable UI components
│   │   ├── services/api.ts       # API client (connects to FastAPI)
│   │   ├── contexts/             # React context providers
│   │   ├── translations/         # i18n translation files
│   │   └── utils/                # Frontend utility functions
│   ├── package.json
│   ├── vite.config.ts
│   └── index.html
│
├── dist/                         # Pre-built frontend (served by FastAPI)
│   └── assets/                   # Compiled JS + CSS bundles
│
├── docs/                         # Project documentation
│   ├── api_documentation.md
│   ├── database_schema_overview.md
│   ├── deployment_guide.md
│   ├── installation_guide.md
│   ├── environment_variables_guide.md
│   ├── admin_manual.md
│   ├── user_manual.md
│   └── troubleshooting_guide.md
│
├── scripts/                      # Developer utility scripts
│   ├── generate_frontend_translations.py
│   ├── generate_admin_token.py
│   └── audit_translations.py
│
├── Project-Presentarion-PPT/     # Project presentation materials
│
├── seed_users.py                 # Database seeding (called on startup)
├── requirements.txt              # Python dependencies
├── requirements-dev.txt          # Dev-only Python dependencies
├── render.yaml                   # Render deployment configuration
├── Procfile                      # Process configuration
├── start.ps1                     # Windows local launcher (both servers)
├── .env.example                  # Environment variable template
├── .gitignore
└── README.md
```

---

## 🔧 Prerequisites

Make sure you have the following installed:

| Software | Version | Required |
|----------|---------|----------|
| Python | 3.10+ | ✅ Yes |
| Node.js | 18+ | ✅ Yes (for frontend development) |
| npm | 9+ | ✅ Yes |
| Git | Any | ✅ Yes |
| PostgreSQL | 14+ | Optional (SQLite used by default) |
| Redis | 6+ | Optional (only for Celery async tasks) |

---

## ⚙️ Local Setup

### 1. Clone the Repository

```bash
git clone https://github.com/AbdulRajak-Shaik/Infosys-Project.git
cd Infosys-Project
```

### 2. Backend Setup

```bash
# Create a virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Configure Environment Variables

```bash
# Copy the example file
copy .env.example .env       # Windows
cp .env.example .env          # Linux/Mac

# Edit .env with your actual API keys (see Environment Variables section)
```

### 4. Frontend Setup (for development only)

```bash
cd AI-Based-Soil-Health-Assessment-System-for-Nutrient-Deficiency-Detection-and-Crop-Recom_Jun_2026-frontend-team-1

npm install

# To run dev server:
npm run dev

# To build production bundle:
npm run build
```

---

## 🔑 Environment Variables

Create a `.env` file from `.env.example`:

```env
# Database (SQLite for dev, PostgreSQL for production)
DATABASE_URL=sqlite:///./soil_health.db

# JWT Authentication (generate strong random keys)
JWT_SECRET_KEY=your_strong_random_secret_key
JWT_REFRESH_SECRET_KEY=your_strong_random_refresh_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
REFRESH_TOKEN_EXPIRE_DAYS=7

# Sarvam AI (multilingual translation)
SARVAM_API_KEY=your_sarvam_api_key
SARVAM_API_URL=https://api.sarvam.ai

# Google Gemini AI (chatbot)
GEMINI_API_KEY_1=your_gemini_api_key

# OpenWeatherMap (weather data)
OPENWEATHER_API_KEY=your_openweather_api_key

# Celery/Redis (optional - for async tasks)
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
```

Get your API keys from:
- **Sarvam AI**: https://www.sarvam.ai/
- **Google Gemini**: https://aistudio.google.com/
- **OpenWeatherMap**: https://openweathermap.org/api

> ⚠️ **Never commit your `.env` file.** It is already in `.gitignore`.

---

## 🚀 Running the Application

### Option A — Single Command (Windows)

```powershell
powershell -ExecutionPolicy Bypass -File .\start.ps1
```

This opens two terminal windows: one for the backend (port 8000) and one for the frontend dev server (port 5173).

### Option B — Manual (Two Terminals)

**Terminal 1 — Backend:**
```powershell
$env:PYTHONPATH = "$(Get-Location)"
Backend\venv\Scripts\uvicorn.exe app.main:app --host 0.0.0.0 --port 8000
```

**Terminal 2 — Frontend dev server:**
```bash
cd frontend
npm run dev
```

Open in browser: **http://localhost:5173**

> **Note**: On Render/production, the backend directly serves the pre-built `dist/` as a unified single-service deployment (no separate frontend server needed).

---

## 📖 API Documentation

Once the backend is running, visit:

| Interface | URL |
|-----------|-----|
| **Swagger UI** | http://localhost:8000/docs |
| **ReDoc** | http://localhost:8000/redoc |
| **OpenAPI JSON** | http://localhost:8000/openapi.json |

For a complete API reference, see [`docs/api_documentation.md`](docs/api_documentation.md).

---

## 🔐 Authentication

The application uses JWT-based authentication:

1. **Register**: `POST /register` — Create a new account
2. **Login**: `POST /login` — Returns `access_token` + `refresh_token`
3. **Protected routes**: Include `Authorization: Bearer <access_token>` header
4. **Refresh**: `POST /refresh` — Get a new access token using refresh token

Token expiry: **24 hours** (access) | **7 days** (refresh)

---

## 👤 Default Login Credentials

> These are seeded automatically on first startup.

| Role | Email | Password |
|------|-------|----------|
| Farmer | `sar@gmail.com` | `Sar@1234` |
| Admin | `admin@agroai.com` | `Admin@123` |

---

## ☁️ Deployment on Render

The application is configured for **unified fullstack deployment** on Render (backend serves the pre-built frontend from `dist/`).

### Render Configuration (`render.yaml`)

```yaml
services:
  - type: web
    name: agroai-app
    env: python
    plan: free
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: PYTHONPATH
        value: .
```

### Required Render Environment Variables

Set these in the Render dashboard under **Environment**:

```
DATABASE_URL=sqlite:///./soil_health.db
JWT_SECRET_KEY=<generate with: openssl rand -hex 32>
JWT_REFRESH_SECRET_KEY=<generate with: openssl rand -hex 32>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=43200
REFRESH_TOKEN_EXPIRE_DAYS=7
SARVAM_API_KEY=<your_key>
GEMINI_API_KEY_1=<your_key>
OPENWEATHER_API_KEY=<your_key>
```

---

## 🗄️ Database Notes

- **Development**: SQLite (`soil_health.db` in project root) — zero setup required
- **Production (Render)**: SQLite is used by default. For persistent data across Render deploys, consider using Render's PostgreSQL addon.
- **PostgreSQL**: Change `DATABASE_URL` to `postgresql://user:password@hostname:5432/dbname`
- **Schema**: Tables are auto-created on startup via SQLAlchemy's `create_all()`
- **Seeding**: Default users are seeded automatically via `seed_users.py` on every startup

---

## 🔧 Development Notes

### Rebuild Frontend

After modifying frontend source files, rebuild the `dist/` and commit it:

```bash
cd frontend
npm run build

# Copy dist to project root (for Render)
xcopy dist ..\dist /E /I /Y     # Windows
cp -r dist ../dist               # Linux/Mac
```

### Run Dev Dependencies (Testing)

```bash
pip install -r requirements-dev.txt
pytest
```

### Translation Utilities

```bash
# Generate frontend translations
python scripts/generate_frontend_translations.py

# Audit translation coverage
python scripts/audit_translations.py
```

### Generate Admin Token

```bash
python scripts/generate_admin_token.py
```

Print the token and use it in API requests:
```
Authorization: Bearer <token>
```

### Run Backend Locally (without start.ps1)

```powershell
# Windows (activate your venv first)
$env:PYTHONPATH = "$(Get-Location)"
python -m uvicorn app.main:app --reload --port 8000
```

### Translation Proxy API

A secure server-side translation proxy is available at `POST /api/translate`. The backend reads `SARVAM_API_KEY` from the environment.

**Request:**
```json
{ "text": "Hello", "source": "en", "target": "hi" }
```

**Response:**
```json
{ "translations": ["\u0928\u092e\u0938\u094d\u0924\u0947"] }
```

> Keep `SARVAM_API_KEY` out of frontend code — always use this proxy endpoint.

---

## 📋 Supported Languages

| Language | Code |
|----------|------|
| English | `en` |
| Telugu | `te` |
| Hindi | `hi` |

---

## 📞 Support

For issues and feature requests, contact the development team or raise an issue in the repository.

---

*Built with ❤️ for Indian farmers — Springboard Internship 2026*
