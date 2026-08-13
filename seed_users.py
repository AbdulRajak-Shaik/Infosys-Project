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
            
        # Seed farmer account (update in-place if exists to prevent foreign key errors)
        farmer = db.query(User).filter(User.email == "farmer@agroai.com").first()
        if not farmer:
            farmer = User(
                username="Farmer User",
                email="farmer@agroai.com",
                hashed_password=get_password_hash("password123"),
                role="farmer",
                status="active",
                language_id=en.id
            )
            db.add(farmer)
            print("Farmer user (farmer@agroai.com / password123) created!")
        else:
            farmer.hashed_password = get_password_hash("password123")
            farmer.role = "farmer"
            db.add(farmer)
            print("Farmer user password hash and role updated in-place!")
            
        # Seed admin account (update in-place if exists to prevent foreign key errors)
        admin = db.query(User).filter(User.email == "admin@agroai.com").first()
        if not admin:
            admin = User(
                username="System Admin",
                email="admin@agroai.com",
                hashed_password=get_password_hash("password123"),
                role="admin",
                status="active",
                language_id=en.id
            )
            db.add(admin)
            print("Admin user (admin@agroai.com / password123) created!")
        else:
            admin.hashed_password = get_password_hash("password123")
            admin.role = "admin"
            db.add(admin)
            print("Admin user password hash and role updated in-place!")
            
        # Seed admin tester account
        admin_test = db.query(User).filter(User.email == "admin_role_test@example.com").first()
        if not admin_test:
            admin_test = User(
                username="Admin Tester",
                email="admin_role_test@example.com",
                hashed_password=get_password_hash("AdminPass123!"),
                role="admin",
                status="active",
                language_id=en.id
            )
            db.add(admin_test)

        # Seed test farmer account
        farmer_test = db.query(User).filter(User.email == "testfarmer1@example.com").first()
        if not farmer_test:
            farmer_test = User(
                username="testfarmer1",
                email="testfarmer1@example.com",
                hashed_password=get_password_hash("Password123!"),
                role="farmer",
                status="active",
                region="Punjab",
                language_id=en.id
            )
            db.add(farmer_test)

        db.commit()
        print("[OK] Default test users successfully verified and seeded!")
    except Exception as e:
        db.rollback()
        print(f"[Error] Failed to seed users: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_users()
