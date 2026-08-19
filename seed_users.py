import sys
import os

# Set python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import User, Language
from app.security import get_password_hash

def seed_users():
    db = SessionLocal()
    try:
        # Seed pre-requisite languages
        en = db.query(Language).filter(Language.language_code == "en").first()
        if not en:
            en = Language(language_name="English", language_code="en", is_default=True, is_active=True)
            db.add(en)
            db.commit()
            db.refresh(en)
            print("English language seeded!")
        else:
            print("English language already exists.")
            
        # Seed test farmer accounts
        for email, username, pwd, role in [
            ("skar@gmail.com", "Skar Farmer", "Sar@1234", "farmer"),
            ("sar@gmail.com", "Sar Farmer", "Sar@1234", "farmer"),
            ("farmer@agroai.com", "Farmer User", "password123", "farmer"),
            ("admin@agroai.com", "System Admin", "password123", "admin"),
            ("admin@agroai.com", "System Admin", "Admin@123", "admin"),
        ]:
            existing = db.query(User).filter(User.email == email).first()
            if not existing:
                u = User(
                    username=username,
                    email=email,
                    hashed_password=get_password_hash(pwd),
                    role=role,
                    status="active",
                    language_id=en.id
                )
                db.add(u)
            else:
                existing.hashed_password = get_password_hash(pwd)
                existing.role = role
                existing.status = "active"
                db.add(existing)

        db.commit()
        print("[OK] Default test users successfully verified and seeded!")

        # Seed baseline prediction history if table is empty
        from app.models import PredictionHistory, ChatHistory
        from datetime import datetime, timezone, timedelta
        
        if db.query(PredictionHistory).count() == 0:
            sar_user = db.query(User).filter(User.email == "sar@gmail.com").first()
            target_user_id = sar_user.id if sar_user else 1
            now = datetime.now(timezone.utc)

            base_predictions = [
                PredictionHistory(
                    user_id=target_user_id,
                    prediction_type="crop",
                    soil_image_path="default_soil.jpg",
                    soil_type="Clay Soil",
                    soil_confidence=96.0,
                    nitrogen=45.0,
                    phosphorus=35.0,
                    potassium=25.0,
                    ph=6.5,
                    organic_carbon=0.55,
                    electrical_conductivity=1.1,
                    temperature=28.0,
                    humidity=65.0,
                    soil_health="Optimal",
                    soil_health_score=88.0,
                    soil_fertility_status="High Fertility",
                    nutrient_deficiencies=["Nitrogen"],
                    recommended_crops=["Rice", "Wheat"],
                    recommended_fertilizers=["Urea", "DAP"],
                    created_at=now - timedelta(days=2)
                ),
                PredictionHistory(
                    user_id=target_user_id,
                    prediction_type="soil",
                    soil_image_path="default_soil.jpg",
                    soil_type="Black Soil",
                    soil_confidence=94.5,
                    nitrogen=60.0,
                    phosphorus=40.0,
                    potassium=30.0,
                    ph=7.2,
                    organic_carbon=0.62,
                    electrical_conductivity=0.9,
                    temperature=29.0,
                    humidity=62.0,
                    soil_health="Good",
                    soil_health_score=82.0,
                    soil_fertility_status="High Fertility",
                    nutrient_deficiencies=[],
                    recommended_crops=["Cotton", "Wheat"],
                    recommended_fertilizers=["MOP", "Compost"],
                    created_at=now - timedelta(days=1)
                ),
                PredictionHistory(
                    user_id=target_user_id,
                    prediction_type="crop",
                    soil_image_path="default_soil.jpg",
                    soil_type="Alluvial Soil",
                    soil_confidence=97.0,
                    nitrogen=50.0,
                    phosphorus=30.0,
                    potassium=20.0,
                    ph=6.8,
                    organic_carbon=0.58,
                    electrical_conductivity=1.0,
                    temperature=27.0,
                    humidity=70.0,
                    soil_health="Optimal",
                    soil_health_score=91.0,
                    soil_fertility_status="High Fertility",
                    nutrient_deficiencies=["Potassium"],
                    recommended_crops=["Rice", "Tomato"],
                    recommended_fertilizers=["MOP", "NPK Complex"],
                    created_at=now - timedelta(hours=5)
                )
            ]
            db.add_all(base_predictions)
            db.commit()
            print("[OK] Baseline prediction history seeded successfully!")

        if db.query(ChatHistory).count() == 0:
            sar_user = db.query(User).filter(User.email == "sar@gmail.com").first()
            target_user_id = sar_user.id if sar_user else 1
            now = datetime.now(timezone.utc)
            base_chats = [
                ChatHistory(
                    user_id=target_user_id,
                    user_message="best crops for more revenue?",
                    assistant_response="High revenue crops include Cotton, Sugarcane, and seasonal Cash Crops depending on your soil and water availability.",
                    question_language="English",
                    preferred_language="English",
                    created_at=now - timedelta(hours=3)
                ),
                ChatHistory(
                    user_id=target_user_id,
                    user_message="How to control stem borer in rice?",
                    assistant_response="Use synchronized planting, remove weeds, and apply recommended bio-pesticides or granular systemic controls.",
                    question_language="English",
                    preferred_language="English",
                    created_at=now - timedelta(hours=1)
                )
            ]
            db.add_all(base_chats)
            db.commit()
            print("[OK] Baseline chat activity seeded successfully!")

    except Exception as e:
        db.rollback()
        print(f"[Error] Failed to seed users: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_users()
