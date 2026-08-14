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
    except Exception as e:
        db.rollback()
        print(f"[Error] Failed to seed users: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_users()
