from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

keys = {
    'languageSelector_desc': 'Choose the language for the application.',
    'searchLanguage': 'Search language...',
    'addCustomLanguage': 'Add Custom Language',
    'enterLanguageName': 'Enter language name...',
    'add': 'Add',
    'cancelAddingLanguage': 'Cancel',
    'floatingChatbot.welcome': 'Hello! I am your AgroAI Assistant. How can I help you today with your farming needs?',
    'floatingChatbot.voiceUnsupported': 'Voice input is supported in Google Chrome, Microsoft Edge, and modern browsers.',
    'floatingChatbot.uploadedImagePlaceholder': 'Uploaded crop/soil image for AI diagnosis',
    'floatingChatbot.aiImageAnalysisExample': '🔬 **AI Image Analysis**: Healthy plant leaf detected with 96% accuracy. Recommendation: Maintain proper watering and apply NPK 19-19-19.',
    'floatingChatbot.cleared': 'Conversation cleared. How can I assist you now?',
    'floatingChatbot.suggestions.whatCropBest': 'What crop is best for sandy soil?',
    'floatingChatbot.suggestions.treatYellowLeaves': 'How to treat yellowing leaves?',
    'floatingChatbot.suggestions.nextRain': 'When is the next rain expected?',
    'floatingChatbot.uploadModal.title': 'Upload Crop or Soil Image',
    'floatingChatbot.uploadModal.takePhoto': 'Take Photo with Camera',
    'floatingChatbot.uploadModal.useCameraDesc': 'Use device camera directly',
    'floatingChatbot.uploadModal.uploadFromDevice': 'Upload from Device',
    'floatingChatbot.uploadModal.selectFromGallery': 'Select image from gallery',
    'floatingChatbot.selectLanguageTitle': 'Select Chatbot Language',
    'floatingChatbot.onlineStatus': 'Online • Multi-lingual & Voice',
    'floatingChatbot.clearChat': 'Clear Chat',
    'floatingChatbot.playVoice': 'Play Voice Output (TTS)',
    'floatingChatbot.copyMessage': 'Copy message'
}

print('[+] Creating/updating English translation keys in DB')
for k,v in keys.items():
    resp = client.post('/api/translations/', json={'key': k, 'language_code': 'en', 'translated_text': v})
    print(k, '->', resp.status_code, resp.json())

print('\n[+] Generating missing translations across active languages')
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
