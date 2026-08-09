Developer notes — test and run instructions

Quick start (backend)

1. Create and activate a Python virtual environment

   python -m venv .venv
   .\.venv\Scripts\activate

2. Install runtime and dev dependencies

   python -m pip install -r requirements.txt
   python -m pip install -r requirements-dev.txt

3. Run the server (example)

   set DATABASE_URL="sqlite:///./dev.db"
   uvicorn app.main:app --reload --port 8000

4. Generate a test admin JWT (useful for manual requests)

   python scripts/generate_admin_token.py

   Use the printed token in requests:
   Authorization: Bearer <token>

Testing

- Run the admin endpoint tests (uses an isolated SQLite DB and seeded fixtures):

  set DATABASE_URL="sqlite:///./test.db"
  pytest tests/test_admin_endpoints.py -q

- Run the full suite (note: `test_model_load.py` is skipped during local dev runs because it requires TF/Keras model artifacts):

  pytest -q

Translation proxy

- A secure server-side translation proxy is available at `POST /api/translate`.
- The backend reads `SARVAM_API_KEY` and `SARVAM_API_URL` from environment (see `.env` via `app/config.py`).

Request shape:

{
  "text": "Hello",
  "source": "en",
  "target": "hi"
}

Response shape:

{
  "translations": ["नमस्ते"]
}

Example curl (replace <token> and API URL):

curl -X POST "http://localhost:8000/api/translate" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello","source":"en","target":"hi"}'

Notes

- Keep `SARVAM_API_KEY` out of frontend code. Use the proxy endpoint from the frontend `TranslationContext` instead.
- The tests now seed deterministic users and chat history via fixtures in `conftest.py`.
