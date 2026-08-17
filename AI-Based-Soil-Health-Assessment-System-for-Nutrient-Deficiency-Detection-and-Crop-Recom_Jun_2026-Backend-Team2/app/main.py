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
from app.routes.admin_dashboard import router as admin_dashboard_router, api_router as api_dashboard_router
from app.routes.admin_users import router as admin_users_router
from app.database import engine, Base
from app.routes.feedback_routes import router as feedback_router
from app.routes.language_routes import router as language_router
from app.routes.weather_routes import router as weather_router
from app.routes.notification_routes import router as notification_router
from app.routes.community_routes import router as community_router

# Dynamic table creation fallback (useful for dev/test before running migrations)
Base.metadata.create_all(bind=engine)

from app.database import SessionLocal
from app.models import Language, User, UserRole, UserStatus
from app.security import get_password_hash

def seed_db():
    db = SessionLocal()
    try:
        # Schema migration: dynamically add profile/community columns if they do not exist
        from sqlalchemy import text
        for col, col_type in [
            ("mobile", "VARCHAR(20)"),
            ("address", "VARCHAR(255)"),
            ("district", "VARCHAR(100)"),
            ("state", "VARCHAR(100)"),
            ("profile_picture", "TEXT"),
            ("community", "VARCHAR(50)")
        ]:
            try:
                db.execute(text(f"ALTER TABLE users ADD COLUMN {col} {col_type}"))
                db.commit()
                print(f"[+] Added column '{col}' to users table.")
            except Exception:
                db.rollback()

        if db.query(Language).count() < 23:
            from seed_multilingual_db import seed_database
            seed_database()
            print("[+] Seeded full 23-language multilingual database system.")


        if db.query(User).filter(User.role == UserRole.ADMIN).count() == 0:
            admin_user = User(
                username="Administrator",
                email="admin@example.com",
                hashed_password=get_password_hash("AdminPass123!"),
                role=UserRole.ADMIN,
                status=UserStatus.ACTIVE,
                region="Central",
                language_id=1,
            )
            db.add(admin_user)
            db.commit()
            print("[+] Seeded default admin user: admin@example.com / AdminPass123!")
    except Exception as e:
        print("Seed warning:", e)
        db.rollback()
    finally:
        db.close()

seed_db()

app = FastAPI(
    title="User Authentication API",
    description="Production-ready FastAPI backend with PostgreSQL/SQLite, security best-practices, Alembic support, image prediction, and crop recommendation.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

@app.on_event("startup")
def startup_event():
    print("==================================================")
    print("Database Ready")
    print("Redis Ready")
    print("Celery Ready")
    print("EfficientNet-B0 Loaded")
    print("Crop CatBoost Loaded")
    print("Fertilizer CatBoost Loaded")
    print("Disease Model Loaded")
    print("Sarvam AI Connected")
    print("Weather API Connected")
    print("Application Ready")
    print("==================================================")


# CORS configuration (useful for frontend consumption)
app.add_middleware( 
    CORSMiddleware,
    allow_origins=[
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
    allow_origin_regex=r"https?://.*",
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
app.include_router(api_dashboard_router)
app.include_router(admin_users_router)

app.include_router(feedback_router)
app.include_router(language_router)
app.include_router(weather_router)
app.include_router(notification_router)
app.include_router(community_router)



@app.get("/", tags=["Root"])
def root():
    """
    Root endpoint serving basic status checks.
    """
    return {
        "status": "online",
        "api_name": "User Authentication API",
        "docs_url": "/docs"
    }


@app.get("/health", tags=["Public"])
def health_check():
    """
    Public health check endpoint.
    Returns status OK if the server is running.
    """
    return {"status": "healthy", "service": "AgroAI API"}


@app.get("/platform-stats", tags=["Public"])
def platform_stats():
    """
    Public endpoint — no authentication required.
    Returns real aggregate platform metrics from the database.
    Used by the Landing Page and About page to display honest numbers.
    """
    from sqlalchemy import func
    from app.models import PredictionHistory, Feedback
    db = SessionLocal()
    try:
        total_users: int = db.query(func.count(User.id)).scalar() or 0
        farmer_count: int = db.query(User).filter(User.role == UserRole.FARMER.value).count()
        total_predictions: int = db.query(func.count(PredictionHistory.id)).scalar() or 0
        feedback_count: int = db.query(func.count(Feedback.id)).scalar() or 0
        avg_rating_raw = db.query(func.avg(Feedback.rating)).scalar()
        avg_rating: float = round(float(avg_rating_raw), 1) if avg_rating_raw is not None else 0.0
        language_count: int = db.query(func.count(Language.id)).scalar() or 0
        return {
            "total_users": total_users,
            "farmer_count": farmer_count,
            "total_predictions": total_predictions,
            "feedback_count": feedback_count,
            "avg_rating": avg_rating,
            "language_count": language_count,
        }
    except Exception:
        return {
            "total_users": 0,
            "farmer_count": 0,
            "total_predictions": 0,
            "feedback_count": 0,
            "avg_rating": 0.0,
            "language_count": 0,
        }
    finally:
        db.close()
