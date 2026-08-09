"""Pytest configuration and fixtures for local testing.

Sets up an SQLite test database, seeds deterministic data, and exposes
`app` and `client` fixtures. Also prevents collection of heavyweight
model-loading tests during local runs.
"""
import os
from pathlib import Path

import pytest

# Prevent collecting heavy model test
collect_ignore = ["test_model_load.py"]


@pytest.fixture(scope="session")
def sqlite_url(tmp_path_factory):
	db_dir = tmp_path_factory.mktemp("data")
	db_file = db_dir / "test.db"
	return f"sqlite:///{db_file}"


@pytest.fixture(scope="session")
def setup_test_db(sqlite_url):
	# Ensure the application reads the test DATABASE_URL when imported
	os.environ["DATABASE_URL"] = sqlite_url

	# Import app.database after env var set so it uses the sqlite URL
	from app.database import engine, Base

	Base.metadata.create_all(bind=engine)
	yield engine
	engine.dispose()


@pytest.fixture
def app(setup_test_db):
	# Import the FastAPI app with test DB in place
	from app.main import app as fastapi_app

	return fastapi_app


@pytest.fixture
def client(app):
	from fastapi.testclient import TestClient
	from app.database import SessionLocal
	from app.models import Language, User, ChatHistory

	# Seed minimal deterministic data
	db = SessionLocal()
	try:
		lang = db.query(Language).filter_by(language_name="English").first()
		if not lang:
			lang = Language(language_name="English", language_code="en", is_default=True)
			db.add(lang)
			db.commit()
			db.refresh(lang)

		admin = db.query(User).filter_by(email="admin@example.com").first()
		if not admin:
			admin = User(username="admin", email="admin@example.com", hashed_password="x", role="admin", language_id=lang.id)
			db.add(admin)

		farmer = db.query(User).filter_by(email="farmer@example.com").first()
		if not farmer:
			farmer = User(username="farmer1", email="farmer@example.com", hashed_password="x", role="farmer", language_id=lang.id)
			db.add(farmer)

		db.commit()

		# ensure we have fresh user ids
		db.refresh(admin)
		db.refresh(farmer)

		# Insert chat history only if not already present
		existing = db.query(ChatHistory).filter_by(user_id=farmer.id, user_message="How much nitrogen?").first()
		if not existing:
			chat1 = ChatHistory(user_id=farmer.id, user_message="How much nitrogen?", assistant_response="Apply 10kg", question_language="en")
			db.add(chat1)

		existing2 = db.query(ChatHistory).filter_by(user_id=farmer.id, user_message="పంట కోసం ఏమి చేయాలి?").first()
		if not existing2:
			chat2 = ChatHistory(user_id=farmer.id, user_message="పంట కోసం ఏమి చేయాలి?", assistant_response="పర్యవేక్షించండి", preferred_language="te")
			db.add(chat2)

		db.commit()
	finally:
		db.close()

	return TestClient(app)
