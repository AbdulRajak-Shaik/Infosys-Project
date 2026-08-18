from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.auth_routes import router as auth_router
from app.routes.prediction_routes import router as prediction_router
from app.routes.crop_routes import router as crop_router
from app.routes.nutrient_routes import router as nutrient_router
from app.routes.soil_fertility_routes import router as soil_fertility_router
from app.routes.soil_health_routes import router as soil_health_router
from app.routes.soil_health_score_routes import router as soil_health_score_router
from app.routes.final_recommendation_routes import router as final_recommendation_router
from app.routes.history_routes import router as history_router
from app.routes.task_routes import router as task_router
from app.routes.chat_routes import router as chat_router
from app.routes.analytics import router as analytics_router
from app.routes.admin_dashboard import router as admin_dashboard_router, api_router as admin_dashboard_api_router
from app.routes.admin_users import router as admin_users_router
from app.database import engine, Base
from app.routes.feedback_routes import router as feedback_router
from app.routes.language_routes import router as language_router
from app.routes.weather_routes import router as weather_router
from app.routes.translation_routes import router as translation_router

# Dynamic table creation fallback (useful for dev/test before running migrations)
try:
    Base.metadata.create_all(bind=engine)
except Exception as exc:
    print(f"Table creation note: {exc}")

# Safe dynamic columns addition
from sqlalchemy import text
try:
    with engine.connect() as conn:
        for col_def in [
            "ALTER TABLE feedback ADD COLUMN admin_response VARCHAR(500)",
            "ALTER TABLE feedback ADD COLUMN is_resolved BOOLEAN DEFAULT FALSE"
        ]:
            try:
                conn.execute(text(col_def))
                conn.commit()
            except Exception:
                pass
except Exception as exc:
    print(f"DB connection note: {exc}")

# Seed default database accounts and languages
try:
    from seed_users import seed_users
    seed_users()
except Exception as exc:
    print(f"User seeding note: {exc}")

app = FastAPI(
    title="User Authentication API",
    description="Production-ready FastAPI backend with PostgreSQL, security best-practices, Alembic support, image prediction, and crop recommendation.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)


# CORS configuration (useful for frontend consumption)
app.add_middleware( 
    CORSMiddleware,
    allow_origins=[
        "https://agroai-frontend-2bmp.onrender.com",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://localhost:8443",
        "http://127.0.0.1:8443",
    ],
    allow_origin_regex=r"https://.*\.onrender\.com|https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include authentication endpoints
app.include_router(auth_router)
app.include_router(prediction_router)
app.include_router(crop_router)
app.include_router(nutrient_router)
app.include_router(soil_fertility_router)
app.include_router(soil_health_router)
app.include_router(soil_health_score_router)
app.include_router(final_recommendation_router)
app.include_router(history_router)
app.include_router(task_router)
app.include_router(chat_router)
app.include_router(analytics_router)

app.include_router(admin_dashboard_router)
app.include_router(admin_dashboard_api_router)
app.include_router(translation_router)
app.include_router(admin_users_router)

app.include_router(feedback_router)
app.include_router(language_router)
app.include_router(weather_router)



# ── Unified Fullstack Static File & SPA Serving ───────────────
import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIST = os.path.join(BASE_DIR, "dist")
if not os.path.exists(FRONTEND_DIST):
    FRONTEND_DIST = os.path.join(BASE_DIR, "AI-Based-Soil-Health-Assessment-System-for-Nutrient-Deficiency-Detection-and-Crop-Recom_Jun_2026-frontend-team-1", "dist")

if os.path.exists(FRONTEND_DIST):
    assets_dir = os.path.join(FRONTEND_DIST, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="static-assets")

    # List of all API path prefixes that must NOT be handled by SPA
    API_PREFIXES = (
        "docs", "redoc", "openapi.json",
        "login", "register", "admin", "refresh",
        "feedback", "history", "predict", "recommend-crop", "predict-crop",
        "predict-image", "nutrient", "soil", "crop", "fertilizer",
        "chatbot", "chat", "task", "analytics", "weather",
        "language", "platform-stats", "api", "notifications",
        "profile", "change-password", "forgot-password",
    )

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        from fastapi.responses import JSONResponse, RedirectResponse
        # Do not intercept known API routes
        if any(full_path == p or full_path.startswith(p + '/') for p in API_PREFIXES):
            # Redirect to the path with trailing slash so the registered API route handles it
            return RedirectResponse(url=f"/{full_path}/", status_code=307)
        target_file = os.path.join(FRONTEND_DIST, full_path)
        if full_path and os.path.isfile(target_file):
            return FileResponse(target_file)
        index_file = os.path.join(FRONTEND_DIST, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return {"status": "online", "api_name": "AgroAI Fullstack Application"}
else:
    @app.get("/", tags=["Root"])
    def root():
        return {
            "status": "online",
            "api_name": "User Authentication API",
            "docs_url": "/docs"
        }
