"""Utility script to generate a JWT for a test admin user.

Usage (from backend folder):
    python scripts/generate_admin_token.py

It prints a JWT that can be used in Authorization: Bearer <token> for testing.
"""
from app.utils import create_access_token

def main():
    payload = {
        "user_id": 1,
        "email": "admin@example.com",
        "role": "admin",
    }
    token = create_access_token(payload)
    print(token)

if __name__ == "__main__":
    main()
