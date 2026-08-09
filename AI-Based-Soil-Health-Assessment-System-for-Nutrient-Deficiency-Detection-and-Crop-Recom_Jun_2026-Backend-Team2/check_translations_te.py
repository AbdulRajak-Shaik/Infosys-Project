from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
print('[+] Fetching translations for telugu (te)')
resp = client.get('/api/translations/?lang=te')
print('Status code:', resp.status_code)
if resp.status_code==200:
    data = resp.json()
    keys_of_interest = ['languageSelector_desc','searchLanguage','addCustomLanguage','enterLanguageName','add','cancelAddingLanguage']
    found = {k: data.get(k) for k in keys_of_interest}
    print('Found keys (subset):')
    for k,v in found.items():
        print(k, '->', repr(v))
else:
    print('Response:', resp.text)
