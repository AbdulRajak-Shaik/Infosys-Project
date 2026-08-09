from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

keys = {
    'chatbotMonitoring': 'Chatbot Monitoring',
    'closeNavigationMenu': 'Close navigation menu'
}

print('[+] Creating/updating English translation keys in DB')
for k,v in keys.items():
    resp = client.post('/api/translations/', json={'key': k, 'language_code': 'en', 'translated_text': v})
    print(k, '->', resp.status_code, resp.json())

print('\n[+] Generating missing translations across active languages (fallback)')
resp2 = client.post('/api/generate-missing-translations', json={})
print('Generate status:', resp2.status_code)
print('Generate response:', resp2.json())

print('\n[+] Checking telugu (te) translations for those keys')
resp3 = client.get('/api/translations/?lang=te')
print('Status:', resp3.status_code)
if resp3.status_code==200:
    data = resp3.json()
    for k in keys:
        print(k, '->', repr(data.get(k)))
else:
    print('Response:', resp3.text)
