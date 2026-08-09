from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

print('[+] Calling POST /api/generate-missing-translations (no language_codes -> all active)')
resp = client.post('/api/generate-missing-translations', json={})
print('Status code:', resp.status_code)
try:
    print('Response JSON:', resp.json())
except Exception as e:
    print('Response text:', resp.text)
