
with open('src/translations/index.ts', 'r', encoding='utf-8') as f:
    content = f.read()

keys_to_check = ['step', 'of', 'analysisNotAvailable', 'aiAnalyzingSoil', 'registeredFarmers', 'feedbackReceived', 'languagesSupported', 'adminRoleDescription', 'continueWithGoogle', 'signIn', 'sat']
for key in keys_to_check:
    idx = content.find('"en":')
    en_end = content.find('  "hi":', idx)
    en_text = content[idx:en_end] if en_end > 0 else content[idx:idx+200000]
    if f'"{key}"' in en_text:
        print(f'FOUND: {key}')
    else:
        print(f'MISSING: {key}')

# Check for Santali
sat_idx = content.find('"sat"')
if sat_idx >= 0:
    print('FOUND Santali (sat) section')
else:
    print('MISSING Santali section in translations')
