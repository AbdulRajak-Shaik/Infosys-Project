import sys
import os
from datetime import datetime, timedelta, timezone

# Set python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import User, Language, Feedback, Notification, PredictionHistory, ChatHistory, Translation, GeneratedReport
from app.security import get_password_hash

def seed():
    db = SessionLocal()
    try:
        print("Cleaning up old database tables...")
        db.query(ChatHistory).delete()
        db.query(Feedback).delete()
        db.query(Notification).delete()
        db.query(PredictionHistory).delete()
        db.query(Translation).delete()
        db.query(GeneratedReport).delete()
        db.query(User).delete()
        db.query(Language).delete()
        db.commit()

        print("Seeding languages...")
        languages = [
            Language(id=1, language_name="English", language_code="en", is_default=True, is_active=True),
            Language(id=2, language_name="Telugu", language_code="te", is_default=False, is_active=True),
            Language(id=3, language_name="Hindi", language_code="hi", is_default=False, is_active=True),
            Language(id=4, language_name="Tamil", language_code="ta", is_default=False, is_active=True),
            Language(id=5, language_name="Kannada", language_code="kn", is_default=False, is_active=True),
            Language(id=6, language_name="Marathi", language_code="mr", is_default=False, is_active=True),
            Language(id=7, language_name="Bengali", language_code="bn", is_default=False, is_active=True),
        ]
        db.add_all(languages)
        db.commit()

        print("Seeding users...")
        pw_hash = get_password_hash("password123")
        
        # 1 Admin, 3 Active Farmers, 2 Inactive Farmers = 6 users total
        users = [
            User(
                id=1,
                username="System Admin",
                email="admin@agroai.com",
                hashed_password=pw_hash,
                role="admin",
                status="active",
                region="Ludhiana, Punjab",
                language_id=1,
                created_at=datetime.now(timezone.utc) - timedelta(days=22),
                last_login_at=datetime.now(timezone.utc) - timedelta(hours=2)
            ),
            User(
                id=2,
                username="Farmer User",
                email="farmer@agroai.com",
                hashed_password=pw_hash,
                role="farmer",
                status="active",
                region="Ludhiana, Punjab",
                language_id=1,
                created_at=datetime.now(timezone.utc) - timedelta(days=17),
                last_login_at=datetime.now(timezone.utc) - timedelta(hours=4)
            ),
            User(
                id=3,
                username="Suresh Patel",
                email="farmer2@agroai.com",
                hashed_password=pw_hash,
                role="farmer",
                status="active",
                region="Bhopal, MP",
                language_id=3,
                created_at=datetime.now(timezone.utc) - timedelta(days=5),
                last_login_at=datetime.now(timezone.utc) - timedelta(hours=8)
            ),
            User(
                id=4,
                username="Ramesh Rao",
                email="farmer3@agroai.com",
                hashed_password=pw_hash,
                role="farmer",
                status="active",
                region="Guntur, AP",
                language_id=2,
                created_at=datetime.now(timezone.utc) - timedelta(days=4),
                last_login_at=datetime.now(timezone.utc) - timedelta(hours=1)
            ),
            User(
                id=5,
                username="Inactive User 1",
                email="inactive_farmer1@agroai.com",
                hashed_password=pw_hash,
                role="farmer",
                status="inactive",
                region="Patiala, Punjab",
                language_id=1,
                created_at=datetime.now(timezone.utc) - timedelta(days=12),
                last_login_at=datetime.now(timezone.utc) - timedelta(days=10)
            ),
            User(
                id=6,
                username="Inactive User 2",
                email="inactive_farmer2@agroai.com",
                hashed_password=pw_hash,
                role="farmer",
                status="inactive",
                region="Amritsar, Punjab",
                language_id=1,
                created_at=datetime.now(timezone.utc) - timedelta(days=2),
                last_login_at=datetime.now(timezone.utc) - timedelta(days=2)
            ),
        ]
        db.add_all(users)
        db.commit()

        print("Seeding feedback items...")
        feedbacks = [
            Feedback(
                id=1,
                user_id=2,
                rating=5,
                comment="Excellent crop recommendations, helped me optimize fertilizer usage!",
                is_resolved=True,
                admin_response="Thank you for your feedback! We are glad it helped.",
                created_at=datetime.now(timezone.utc) - timedelta(days=10)
            ),
            Feedback(
                id=2,
                user_id=3,
                rating=4,
                comment="Good AI predictions. The Hindi translation is very helpful.",
                is_resolved=False,
                admin_response=None,
                created_at=datetime.now(timezone.utc) - timedelta(days=3)
            ),
            Feedback(
                id=3,
                user_id=4,
                rating=5,
                comment="Love the platform, very easy to use soil classification models.",
                is_resolved=True,
                admin_response="Happy to hear that. We will keep adding features!",
                created_at=datetime.now(timezone.utc) - timedelta(days=1)
            ),
        ]
        db.add_all(feedbacks)
        db.commit()

        print("Seeding notifications...")
        notifications = [
            Notification(
                id=1,
                user_id=1,
                title="System Alert: Database Backup Completed",
                message="Platform database backed up successfully. All integrity checks passed.",
                category="system",
                is_read=False,
                created_at=datetime.now(timezone.utc) - timedelta(hours=3)
            ),
            Notification(
                id=2,
                user_id=1,
                title="New Farmer Registration",
                message="farmer3@agroai.com registered from Guntur, AP.",
                category="system",
                is_read=False,
                created_at=datetime.now(timezone.utc) - timedelta(hours=1)
            ),
            Notification(
                id=3,
                user_id=1,
                title="Feedback Received",
                message="New 5-star rating submitted by farmer@agroai.com.",
                category="system",
                is_read=True,
                created_at=datetime.now(timezone.utc) - timedelta(days=1)
            ),
        ]
        db.add_all(notifications)
        db.commit()

        print("Bypassing predictions seeding (reflecting exactly 0 predictions)...")
        # No predictions added to keep database in a zero state.

        print("[OK] database seeded successfully!")
    except Exception as e:
        db.rollback()
        print(f"[Error] Failed to seed database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
