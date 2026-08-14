/**
 * Central API Client for AgroAI Frontend
 * Connects React UI to FastAPI Backend at http://127.0.0.1:8000
 */

function getBaseUrl(): string {
  let rawUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();
  
  // If deployed on Render (.onrender.com) and env var is missing or localhost, fallback to live backend
  if (typeof window !== 'undefined' && window.location.hostname.includes('.onrender.com')) {
    if (!rawUrl || rawUrl.includes('localhost') || rawUrl.includes('127.0.0.1')) {
      rawUrl = 'https://agroai-backend-0egu.onrender.com';
    }
  }
  
  if (!rawUrl) {
    rawUrl = 'http://127.0.0.1:8000';
  }
  
  if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
    rawUrl = `https://${rawUrl}`;
  }
  
  return rawUrl.replace(/\/$/, '');
}

const BASE_URL = getBaseUrl();

function getAuthHeaders(isFormData = false): Record<string, string> {
  const headers: Record<string, string> = {};
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  const token = localStorage.getItem('access_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...getAuthHeaders(isFormData),
    ...(options.headers as Record<string, string> || {}),
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `API Error (${response.status})`;
    try {
      const errorData = await response.json();
      if (errorData.detail) {
        if (typeof errorData.detail === 'string') {
          errorMessage = errorData.detail;
        } else if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map((e: any) => e.msg || JSON.stringify(e)).join(', ');
        }
      } else if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch {
      // fallback
    }
    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
}

// ── Translation Database API ────────────────────────────────
export async function fetchDatabaseTranslations(lang: string): Promise<Record<string, string>> {
  try {
    return await request<Record<string, string>>(`/api/language/${encodeURIComponent(lang)}/dictionary`);
  } catch (err) {
    console.warn('Database translation fetch warning:', err);
    return {};
  }
}

export async function fetchLanguagesList(): Promise<any[]> {
  try {
    return await request<any[]>('/api/languages/');
  } catch (err) {
    console.warn('Languages fetch warning:', err);
    return [];
  }
}

export async function translateTextApi(text: string, targetLanguage: string): Promise<string> {
  try {
    const res = await request<any>('/api/translate/', {
      method: 'POST',
      body: JSON.stringify({ text, target_language: targetLanguage }),
    });
    return res.translated_text || text;
  } catch {
    return text;
  }
}

export async function transliterateTextApi(text: string, targetLanguage: string): Promise<string> {
  try {
    const res = await request<any>('/api/transliterate/', {
      method: 'POST',
      body: JSON.stringify({ text, target_language: targetLanguage }),
    });
    return res.transliterated_text || text;
  } catch {
    return getLocalizedPersonName(text, targetLanguage);
  }
}

export function getLocalizedPersonName(name: string, lang = 'en'): string {
  if (!name) return name;
  const l = lang.toLowerCase();
  
  if (l.includes('te') || l.includes('telugu')) {
    if (name.includes('Rahul') || name.includes('RF')) return 'రాహుల్ రామాయణం';
    if (name.includes('Rajesh')) return 'రాజేష్ కుమార్';
    if (name.toLowerCase() === 'farmer') return 'రైతు';
    if (name.toLowerCase() === 'admin') return 'అడ్మిన్';
  } else if (l.includes('ta') || l.includes('tamil')) {
    if (name.includes('Rahul') || name.includes('RF')) return 'ராகுல் இராமாயணம்';
    if (name.includes('Rajesh')) return 'ராஜேஷ் குமார்';
    if (name.toLowerCase() === 'farmer') return 'விவசாயி';
    if (name.toLowerCase() === 'admin') return 'நிர்வாகி';
  } else if (l.includes('hi') || l.includes('hindi')) {
    if (name.includes('Rahul') || name.includes('RF')) return 'राहुल रामायणम';
    if (name.includes('Rajesh')) return 'राजेश कुमार';
    if (name.toLowerCase() === 'farmer') return 'किसान';
    if (name.toLowerCase() === 'admin') return 'प्रशासक';
  } else if (l.includes('kn') || l.includes('kannada')) {
    if (name.includes('Rahul') || name.includes('RF')) return 'ರಾಹುಲ್ ರಾಮಾಯಣಂ';
    if (name.includes('Rajesh')) return 'ರಾಜೇಶ್ ಕುಮಾರ್';
    if (name.toLowerCase() === 'farmer') return 'ರೈತ';
  } else if (l.includes('ml') || l.includes('malayalam')) {
    if (name.includes('Rahul') || name.includes('RF')) return 'രാഹുൽ രാമായണം';
    if (name.includes('Rajesh')) return 'രാജേഷ് കുമാർ';
    if (name.toLowerCase() === 'farmer') return 'കർഷകൻ';
  }
  return name;
}

export async function bulkTranslateApi(texts: string[], targetLanguage: string): Promise<Record<string, string>> {
  try {
    const res = await request<any>('/api/bulk-translate/', {
      method: 'POST',
      body: JSON.stringify({ texts, target_language: targetLanguage }),
    });
    return res.translations || {};
  } catch {
    return {};
  }
}

export function getMultilingualPdfUrl(languageCode: string, farmerName = 'Rahul Ramayanam'): string {
  return `${BASE_URL}/api/generate-pdf-report?language_code=${encodeURIComponent(languageCode)}&farmer_name=${encodeURIComponent(farmerName)}`;
}

// ── Auth APIs ──────────────────────────────────────────────
export interface LoginPayload {
  email: string;
  password: string;
  role?: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  confirm_password: string;
  language_id: number;
  region: string;
  role?: 'farmer' | 'admin';
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface UserProfile {
  id: number;
  username?: string | null;
  email: string;
  role: 'farmer' | 'admin';
  status: string;
  region?: string | null;
  language_id?: number | null;
  created_at: string;
  last_login_at?: string | null;
}

export async function loginUser(payload: LoginPayload): Promise<TokenResponse> {
  const data = await request<TokenResponse>('/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  localStorage.setItem('access_token', data.access_token);
  localStorage.setItem('refresh_token', data.refresh_token);
  return data;
}

export async function loginAdmin(payload: LoginPayload): Promise<TokenResponse> {
  const data = await request<TokenResponse>('/admin/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  localStorage.setItem('access_token', data.access_token);
  localStorage.setItem('refresh_token', data.refresh_token);
  return data;
}

export async function registerUser(payload: RegisterPayload): Promise<{ message: string }> {
  return request<{ message: string }>('/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export const LANGUAGE_CODE_TO_ID: Record<string, number> = {
  en: 1, hi: 2, te: 3, ta: 4, kn: 5, ml: 6, mr: 7, gu: 8, bn: 9, pa: 10,
  or: 11, as: 12, ur: 13, mai: 14, mni: 15, sat: 16, brx: 17, doi: 18, ks: 19,
  kok: 20, ne: 21, sa: 22, sd: 23,
};

export const LANGUAGE_ID_TO_CODE: Record<number, string> = {
  1: 'en', 2: 'hi', 3: 'te', 4: 'ta', 5: 'kn', 6: 'ml', 7: 'mr', 8: 'gu', 9: 'bn', 10: 'pa',
  11: 'or', 12: 'as', 13: 'ur', 14: 'mai', 15: 'mni', 16: 'sat', 17: 'brx', 18: 'doi', 19: 'ks',
  20: 'kok', 21: 'ne', 22: 'sa', 23: 'sd',
};

export async function getCurrentUser(): Promise<UserProfile> {
  return request<UserProfile>('/me', { method: 'GET' });
}

export async function updateUserLanguage(langCode: string, email?: string): Promise<UserProfile | null> {
  const token = localStorage.getItem('access_token');
  if (!token) return null;
  const langId = LANGUAGE_CODE_TO_ID[langCode] || 1;
  try {
    let currentEmail = email;
    if (!currentEmail) {
      const u = await getCurrentUser();
      currentEmail = u.email;
    }
    return await request<UserProfile>('/me', {
      method: 'PUT',
      body: JSON.stringify({ email: currentEmail, language_id: langId }),
    });
  } catch (err) {
    console.warn('Failed to update language on backend:', err);
    return null;
  }
}

export async function logoutUser(): Promise<{ message: string }> {
  const result = await request<{ message: string }>('/logout', { method: 'POST' });
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  return result;
}

export async function requestPasswordReset(email: string): Promise<{ message: string }> {
  return request<{ message: string }>('/forgot-password/request', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function verifyPasswordReset(email: string, code: string): Promise<{ reset_token: string }> {
  return request<{ reset_token: string }>('/forgot-password/verify', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  });
}

export async function forgotPassword(payload: { email: string; reset_token: string; new_password: string; confirm_password: string }): Promise<{ message: string }> {
  return request<{ message: string }>('/forgot-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ── AI & Soil Modules APIs ─────────────────────────────────
export interface PredictSoilPayload {
  image?: File | null;
  nitrogen?: number;
  phosphorus?: number;
  potassium?: number;
  ph?: number;
  organic_carbon?: number;
  electrical_conductivity?: number;
  temperature?: number;
  humidity?: number;
}

export interface PredictSoilResponse {
  soil_type?: string;
  confidence?: number;
  soil_health?: string;
  soil_health_score?: number;
  soil_fertility_status?: string;
  deficiencies?: Array<{ nutrient: string; severity: string; recommendation: string }>;
  recommended_crops?: string[];
  recommended_fertilizers?: string[];
  message?: string;
}

export async function predictSoil(payload: PredictSoilPayload): Promise<PredictSoilResponse> {
  const formData = new FormData();
  if (payload.image) {
    formData.append('file', payload.image);
  }
  if (payload.nitrogen !== undefined) formData.append('nitrogen', payload.nitrogen.toString());
  if (payload.phosphorus !== undefined) formData.append('phosphorus', payload.phosphorus.toString());
  if (payload.potassium !== undefined) formData.append('potassium', payload.potassium.toString());
  if (payload.ph !== undefined) formData.append('ph', payload.ph.toString());
  if (payload.organic_carbon !== undefined) formData.append('organic_carbon', payload.organic_carbon.toString());
  if (payload.electrical_conductivity !== undefined) formData.append('electrical_conductivity', payload.electrical_conductivity.toString());
  if (payload.temperature !== undefined) formData.append('temperature', payload.temperature.toString());
  if (payload.humidity !== undefined) formData.append('humidity', payload.humidity.toString());

  return request<PredictSoilResponse>('/predict', {
    method: 'POST',
    body: formData,
  });
}

export interface CropRecommendPayload {
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  temperature: number;
  humidity: number;
  ph: number;
  rainfall: number;
}

export interface CropRecommendResponse {
  recommended_crop?: string;
  confidence?: number;
  top_crops?: Array<{ crop: string; probability: number }>;
  message?: string;
}

export async function recommendCrop(payload: CropRecommendPayload): Promise<CropRecommendResponse> {
  return request<CropRecommendResponse>('/recommend-crop', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export interface SoilHealthScorePayload {
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  ph: number;
  organic_carbon?: number;
  electrical_conductivity?: number;
}

export interface SoilHealthScoreResponse {
  soil_health_score: number;
  soil_health_category: string;
  soil_fertility_status: string;
  recommendations: string[];
}

export interface ChatResponse {
  response?: string;
  assistant_response?: string;
  english_response?: string;
  telugu_response?: string;
  hindi_response?: string;
  tamil_response?: string;
}

export async function calculateSoilHealthScore(payload: SoilHealthScorePayload): Promise<SoilHealthScoreResponse> {
  return request<SoilHealthScoreResponse>('/soil-health-score', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getFinalRecommendation(payload: any): Promise<any> {
  return request<any>('/final-recommendation', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function isAgricultureQuery(question: string): boolean {
  const q = question.toLowerCase();
  const agKeywords = [
    'crop', 'soil', 'fertilizer', 'paddy', 'rice', 'wheat', 'maize', 'sugarcane', 'cotton', 'groundnut',
    'npk', 'urea', 'dap', 'mop', 'pest', 'disease', 'blight', 'rust', 'irrigate', 'water', 'farm', 'agriculture',
    'yield', 'seed', 'ph', 'leaf', 'plant', 'rain', 'weather', 'monsoon', 'harvest', 'field', 'land', 'farming',
    'hello', 'hi', 'namaste', 'vanakkam', 'namaskaram',
    // Telugu
    'వరి', 'పంట', 'నేల', 'ఎరువు', 'ఎరువులు', 'విత్తన', 'తెగులు', 'పురుగు', 'వర్షం', 'సాగు', 'భూమి', 'చేను', 'రైతు',
    // Tamil
    'நெல்', 'பயிர்', 'மண்', 'உரம்', 'உரங்கள்', 'விதை', 'நோய்', 'பூச்சி', 'மழை', 'விவசாயம்', 'உழவர்',
    // Hindi
    'फसल', 'धान', 'गेहूं', 'मिट्टी', 'उर्वरक', 'खाद', 'बीज', 'रोग', 'कीट', 'बारिश', 'कृषि', 'खेती', 'किसान',
    // Urdu
    'فصل', 'دھان', 'مٹی', 'کھاد', 'زرعی',
    // Odia
    'ଫସଲ', 'ମାଟି', 'ସାର', 'ଚାଷ',
    // Assamese
    'শস্য', 'মাটি', 'সাৰ', 'খেতি'
  ];
  return agKeywords.some(k => q.includes(k));
}

export function getAgronomicAiResponse(question: string, targetLanguage?: string): string {
  const q = question.toLowerCase();

  // Detect language from question characters or targetLanguage param
  let lang = targetLanguage || 'English';
  if (!targetLanguage || targetLanguage === 'English') {
    if (/[\u0c00-\u0c7f]/.test(question)) lang = 'Telugu';
    else if (/[\u0b80-\u0bff]/.test(question)) lang = 'Tamil';
    else if (/[\u0900-\u097f]/.test(question)) lang = 'Hindi';
    else if (/[\u0c80-\u0cff]/.test(question)) lang = 'Kannada';
    else if (/[\u0d00-\u0d7f]/.test(question)) lang = 'Malayalam';
    else if (/[\u0980-\u09ff]/.test(question)) lang = 'Bengali';
    else if (/[\u0a80-\u0aff]/.test(question)) lang = 'Gujarati';
    else if (/[\u0a00-\u0a7f]/.test(question)) lang = 'Punjabi';
    else if (/[\u0b00-\u0b7f]/.test(question)) lang = 'Odia';
    else if (/[\u0600-\u06ff]/.test(question)) lang = 'Urdu';
  }

  const l = lang.toLowerCase();

  // 1. NON-AGRICULTURE QUERY FILTER
  if (!isAgricultureQuery(question)) {
    if (l.includes('telugu') || l.includes('te')) {
      return `నేను వ్యవసాయము మరియు నేల ఆరోగ్యానికి కేటాయించిన AI వ్యవసాయ అసిస్టెంట్ ని 🌾. 

నేను పంటలు, నేల స్వభావం, ఎరువుల వాడకం, వాతావరణం మరియు పురుగు మందుల నివారణకు సంబంధించిన ప్రశ్నలకు మాత్రమే సమాధానం ఇవ్వగలను. 

దయచేసి వ్యవసాయానికి లేదా మీ పంటలకు సంబంధించిన ప్రశ్నను మాత్రమే అడగండి!`;
    }
    if (l.includes('tamil') || l.includes('ta')) {
      return `நான் விவசாயம் மற்றும் மண் வளத்திற்கு மட்டுமே பிரத்யேகமாக உருவாக்கப்பட்ட AI உதவியாளர் 🌾.

பயிர்கள், மண் வளம், உர மேலாண்மை, வானிலை மற்றும் பூச்சி கட்டுப்பாடு தொடர்பான கேள்விகளுக்கு மட்டுமே என்னால் பதிலளிக்க முடியும்.

தயவுசெய்து விவசாயம் அல்லது உங்கள் பயிர் சார்ந்த கேள்வியைக் கேட்கவும்!`;
    }
    if (l.includes('hindi') || l.includes('hi')) {
      return `मैं एक विशेष कृषि एवं मृदा स्वास्थ्य AI सहायक हूँ 🌾।

मैं केवल खेती, फसलों, मिट्टी, उर्वरकों, मौसम और कीट नियंत्रण से जुड़े प्रश्नों के उत्तर दे सकता हूँ।

कृपया केवल कृषि या अपनी फसल से संबंधित प्रश्न पूछें!`;
    }
    if (l.includes('urdu') || l.includes('ur')) {
      return `میں ایک خصوصی زراعت اور مٹی کی صحت کا AI اسسٹنٹ ہوں 🌾۔

میں صرف فصلوں، مٹی، کھاد، موسم اور کیڑوں سے متعلق سوالات کے جوابات دے سکتا ہوں۔

براہ کرم صرف زراعت یا اپنی فصل سے متعلق سوال پوچھیں!`;
    }
    if (l.includes('assamese') || l.includes('as')) {
      return `মই কৃষি আৰু মাটিৰ স্বাস্থ্যৰ বাবে উৎসৰ্গিত AI কৃষি সহায়ক 🌾।

মই কেৱল খেতি, শস্য, মাটি, সাৰ আৰু বতৰ সম্পৰ্কীয় প্ৰশ্নৰ উত্তৰ দিব পাৰোঁ।

অনুগ্ৰহ কৰি কেৱল কৃষি সম্পৰ্কীয় প্ৰশ্ন সুধিব!`;
    }
    if (l.includes('odia') || l.includes('or')) {
      return `ମୁଁ ଏକ ବିଶେଷ କୃଷି ଏବଂ ମୃତ୍ତିକା ସ୍ୱାସ୍ଥ୍ୟ AI ସହାୟକ 🌾 |

ମୁଁ କେବଳ ଫସଲ, ମାଟି, ସାର ଏବଂ ପାଣିପାଗ ସମ୍ବନ୍ଧୀୟ ପ୍ରଶ୍ନର ଉତ୍ତର ଦେଇପାରିବି |

ଦୟାକରି କେବଳ କୃଷି ସମ୍ବନ୍ଧୀୟ ପ୍ରଶ୍ନ ପଚାରନ୍ତୁ!`;
    }
    if (l.includes('kannada') || l.includes('kn')) {
      return `ನಾನು ಕೃಷಿ ಮತ್ತು ಮಣ್ಣಿನ ಆರೋಗ್ಯಕ್ಕಾಗಿ ಮೀಸಲಾಗಿರುವ AI ಕೃಷಿ ಸಹಾಯಕ 🌾.

ನಾನು ಬೆಳೆಗಳು, ಮಣ್ಣಿನ ಸ್ಥಿತಿ, ರಸಗೊಬ್ಬರ ಬಳಕೆ, ಹವಾಮಾನ ಮತ್ತು ಕೀಟ ನಿಯಂತ್ರಣಕ್ಕೆ ಸಂಬಂಧಿಸಿದ ಪ್ರಶ್ನೆಗಳಿಗೆ ಮಾತ್ರ ಉತ್ತರಿಸಬಲ್ಲೆ.

ದಯವಿಟ್ಟು ಕೃಷಿ ಅಥವಾ ನಿಮ್ಮ ಬೆಳೆಗೆ ಸಂಬಂಧಿಸಿದ ಪ್ರಶ್ನೆಯನ್ನು ಮಾತ್ರ ಕೇಳಿ!`;
    }
    if (l.includes('malayalam') || l.includes('ml')) {
      return `ഞാൻ കൃഷിക്കും മണ്ണ് സംരക്ഷണത്തിനുമായി പ്രവർത്തിക്കുന്ന AI കാർഷിക സഹായിയാണ് 🌾.

വിളകൾ, മണ്ണ്, വളപ്രയോഗം, കാലാവസ്ഥ, കീടനിയന്ത്രണം എന്നിവയുമായി ബന്ധപ്പെട്ട ചോദ്യങ്ങൾക്ക് മാത്രമേ എനിക്ക് മറുപടി നൽകാൻ കഴിയൂ.

ദയവായി കൃഷിയുമായി ബന്ധപ്പെട്ട ചോദ്യങ്ങൾ മാത്രം ചോദിക്കുക!`;
    }
    if (l.includes('marathi') || l.includes('mr')) {
      return `मी एक विशेष कृषी आणि मृदा आरोग्य AI सहाय्यक आहे 🌾.

मी फक्त शेती, पिके, माती, खते, हवामान आणि कीटक नियंत्रणाशी संबंधित प्रश्नांची उत्तरे देऊ शकतो.

कृपया फक्त शेती किंवा तुमच्या पिकांशी संबंधित प्रश्न विचारू शकता!`;
    }

    if (l.includes('malayalam') || l.includes('ml')) {
      return `**നെല്ല് & വിളകൾക്ക് മികച്ച വളപ്രയോഗം (NPK Ratios)** 🌾

**ഉചിതമായ വള പ്രയോഗം (ഏക്കറിന്):**
- **യൂറിയ (Nitrogen):** 80 കി.ഗ്രാം/ഏക്കർ (3 ഘട്ടങ്ങളിലായി നൽകുക)
- **ഡി.എ.പി (DAP 18-46-0):** 40-50 കി.ഗ്രാം/ഏക്കർ
- **എം.ഒ.പി (MOP 60% K2O):** 30-40 കി.ഗ്രാം/ഏക്കർ.`;
    }

    if (l.includes('marathi') || l.includes('mr')) {
      return `**भात आणि पिकांसाठी सर्वोत्तम खत व्यवस्थापन (NPK Ratios)** 🌾

**शिफारस केलेले खतांचे प्रमाण (प्रति एकर):**
- **युरिया (Nitrogen):** 80 किग्रॅ/एकरी (3 हप्त्यांमध्ये द्या)
- **डीएપી (DAP 18-46-0):** 40-50 किग्रॅ/एकरी
- **पोटॅश (MOP 60% K2O):** 30-40 किग्रॅ/एकरी.`;
    }

    return `**Best Fertilizer Application Advisory for Rice / Crops** 🌾

**Recommended NPK Dosage:**
- **Nitrogen (N):** 120 kg/ha — Apply 1/3 at sowing, 1/3 at tillering, and 1/3 at flowering.
- **Phosphorus (P):** 60 kg/ha — Apply **DAP (18-46-0)** @ 40 kg/acre as basal dose before sowing.
- **Potassium (K):** 50 kg/ha — Apply **MOP (Muriate of Potash 60% K2O)** @ 50 kg/acre at field preparation.

**Best Practices:**
1. Always irrigate lightly after chemical fertilizer application.
2. Mix organic compost (Farm Yard Manure @ 3–5 tons/acre) to improve fertilizer efficiency.`;

  // 2. FERTILIZER & RICE QUERIES
  if (q.includes('fertilizer') || q.includes('npk') || q.includes('urea') || q.includes('dap') || q.includes('ఉత్తమ') || q.includes('உரம்') || q.includes('உரங்கள்') || q.includes('நெல்') || q.includes('ఎరువులు') || q.includes('ఎరువు') || q.includes('వరి') || q.includes('खाद') || q.includes('उर्वरक') || q.includes('धान') || q.includes('ಬೆಳೆ') || q.includes('വളം') || q.includes('ખાન') || q.includes('ਸਾਰ') || q.includes('کھاد') || q.includes('সাৰ') || q.includes('ସାର')) {
    if (l.includes('telugu') || l.includes('te')) {
      return `**వరి & పంటలకు ఉత్తమమైన ఎరువుల యాజమాన్యం (NPK Ratios)** 🌾

వరి పంటలో అధిక దిగుబడి సాధించడానికి సమగ్ర ఎరువుల యాజమాన్యం ఎంతో ముఖ్యం:

**1. సిఫార్సు చేసిన ఎరువుల మోతాదు (ఎకరానికి):**
- **నైట్రోజన్ (యురియా - Urea):** 80 కేజీలు / ఎకరానికి (మూడు దఫాలుగా వేయాలి)
  - 1/3 వంతు నాటు వేసే సమయంలో (దుక్కిలో)
  - 1/3 వంతు పిలకలు తొడిగే దశలో (20-25 రోజులకు)
  - 1/3 వంతు చిరుపొట్ట దశలో (40-45 రోజులకు)
- **భాస్వరం (DAP 18-46-0):** 40-50 కేజీలు / ఎకరానికి — నాటు వేసే ముందే ఆఖరి దుక్కిలో వేయాలి.
- **పొటాషియం (MOP 60% K2O):** 30-40 కేజీలు / ఎకరానికి — ఆఖరి దుక్కిలో వేయాలి.`;
  }

  if (l.includes('malayalam') || l.includes('ml')) {
    return `**നമസ്കാരം! ഞാൻ നിങ്ങളുടെ AgroAI കാർഷിക സഹായിയാണ്** 🌱

നിങ്ങളുടെ കൃഷി സംശയങ്ങൾക്ക് മറുപടി നൽകാൻ ഞാൻ ഇവിടെയുണ്ട്:
- 🌾 **വിള ശുപാർശകൾ**
- 🧪 **വളപ്രയോഗം**
- ☁️ **കാലാവസ്ഥാ മുന്നറിയിപ്പുകൾ**

നിങ്ങളുടെ ചോദ്യം താഴെ ടൈപ്പ് ചെയ്യുക!`;
  }

  if (l.includes('marathi') || l.includes('mr')) {
    return `**नमस्कार! मी तुमचा AgroAI कृषी सहाय्यक आहे** 🌱

मी तुमच्या शेतीविषयक प्रश्नांमध्ये मदत करण्यास तयार आहे:
- 🌾 **पीक शिफारसी**
- 🧪 **खत व्यवस्थापन**
- ☁️ **हवामान आणि शेती सल्ला**

तुमचा प्रश्न येथे टाईप करा!`;
  }

  if (l.includes('bengali') || l.includes('bn')) {
    return `**নমস্কার! আমি আপনার AgroAI কৃষি সহকারী** 🌱

আপনার কৃষি সম্পর্কিত প্রশ্নের উত্তর দিতে সাহায্য করতে পারি:
- 🌾 **ফসল সুপারিশ**
- 🧪 **সার ব্যবস্থাপনা**
- ☁️ **আবহাওয়া পূর্বাভাস**

আপনার প্রশ্ন এখানে লিখুন!`;
  }

  if (l.includes('gujarati') || l.includes('gu')) {
    return `**નમસ્તે! હું તમારો AgroAI કૃષિ સહાયક છું** 🌱

તમારા ખેતી પ્રશ્નોના ઉત્તર આપવા માટે તૈયાર છું:
- 🌾 **પાક ભલામણ**
- 🧪 **ખાતર વ્યવસ્થાપન**
- ☁️ **હવામાન સલાહ**

તમારો પ્રશ્ન અહીં લખો!`;
  }

  if (l.includes('punjabi') || l.includes('pa')) {
    return `**ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ! ਮੈਂ ਤੁਹਾਡਾ AgroAI ਖੇਤੀਬਾੜੀ ਸਹਾਇਕ ਹਾਂ** 🌱

ਖੇਤੀਬਾੜੀ ਅਤੇ ਫ਼ਸਲਾਂ ਦੇ ਸਵਾਲਾਂ ਵਿੱਚ ਤੁਹਾਡੀ ਮਦਦ ਕਰਨ ਲਈ ਤਿਆਰ ਹਾਂ:
- 🌾 **ਫ਼ਸਲ ਸਿਫਾਰਸ਼ਾਂ**
- 🧪 **ਖਾਦ ਪ੍ਰਬੰਧਨ**
- ☁️ **ਮੌਸਮ ਦੀ ਜਾਣਕਾਰੀ**

ਆਪਣਾ ਸਵਾਲ ਇੱਥੇ ਲਿਖੋ!`;
  }

  return `**Hello! I am your AI Agriculture & Soil Health Assistant** 🌱

To get the best yield, maintain balanced N-P-K nutrient application (typically 120-60-40 kg/ha for cereals), keep soil pH between 6.0 and 7.5, and ensure timely irrigation. You can use our Soil Health & Crop Recommendation modules for personalized farm analysis!`;
  }

    if (l.includes('kannada') || l.includes('kn')) {
      return `**ಭತ್ತ ಮತ್ತು ಬೆಳೆಗಳಿಗೆ ಉತ್ತಮ ರಸಗೊಬ್ಬರ ನಿರ್ವಹಣೆ (NPK Ratios)** 🌾

ಹೆಚ್ಚಿನ ಇಳುವರಿ ಪಡೆಯಲು ಸೂಕ್ತ ರಸಗೊಬ್ಬರ ಪ್ರಮಾಣ:

**1. ಶಿಫಾರಸು ಮಾಡಿದ ರಸಗೊಬ್ಬರ ಪ್ರಮಾಣ (ಎಕರೆಗೆ):**
- **ಯೂರಿಯಾ (Nitrogen):** 80 ಕೆಜಿ/ಎಕರೆ (3 ಕಂತುಗಳಲ್ಲಿ ನೀಡಿ)
- **ಡಿಎಪಿ (DAP 18-46-0):** 40-50 ಕೆಜಿ/ಎಕರೆ — ಬಿತ್ತನೆಗೂ ಮುನ್ನ ನೀಡಿ.
- **ಪೊಟ್ಯಾಶ್ (MOP 60% K2O):** 30-40 ಕೆಜಿ/ಎಕರೆ.`;
    }

    if (l.includes('malayalam') || l.includes('ml')) {
      return `**നെല്ല് & വിളകൾക്ക് മികച്ച വളപ്രയോഗം (NPK Ratios)** 🌾

**ഉചിതമായ വള പ്രയോഗം (ഏക്കറിന്):**
- **യൂറിയ (Nitrogen):** 80 കി.ഗ്രാം/ഏക്കർ (3 ഘട്ടങ്ങളിലായി നൽകുക)
- **ഡി.എ.പി (DAP 18-46-0):** 40-50 കി.ഗ്രാം/ഏക്കർ
- **എം.ഒ.പി (MOP 60% K2O):** 30-40 കി.ഗ്രാം/ഏക്കർ.`;
    }

    if (l.includes('marathi') || l.includes('mr')) {
      return `**भात आणि पिकांसाठी सर्वोत्तम खत व्यवस्थापन (NPK Ratios)** 🌾

**शिफारस केलेले खतांचे प्रमाण (प्रति एकर):**
- **युरिया (Nitrogen):** 80 किग्रॅ/एकरी (3 हप्त्यांमध्ये द्या)
- **डीएपी (DAP 18-46-0):** 40-50 किग्रॅ/एकरी
- **पोटॅश (MOP 60% K2O):** 30-40 किग्रॅ/एकरी.`;
    }

    return `**Best Fertilizer Application Advisory for Rice / Crops** 🌾

**Recommended NPK Dosage:**
- **Nitrogen (N):** 120 kg/ha — Apply 1/3 at sowing, 1/3 at tillering, and 1/3 at flowering.
- **Phosphorus (P):** 60 kg/ha — Apply **DAP (18-46-0)** @ 40 kg/acre as basal dose before sowing.
- **Potassium (K):** 50 kg/ha — Apply **MOP (Muriate of Potash 60% K2O)** @ 50 kg/acre at field preparation.

**Best Practices:**
1. Always irrigate lightly after chemical fertilizer application.
2. Mix organic compost (Farm Yard Manure @ 3–5 tons/acre) to improve fertilizer efficiency.`;
  }

  // 3. SOIL & LAND QUERIES
  if (q.includes('sandy') || q.includes('ph') || q.includes('soil') || q.includes('மண்') || q.includes('నేల') || q.includes('मिट्टी') || q.includes('ಮಣ್ಣು') || q.includes('മണ്ണ്')) {
    if (l.includes('telugu') || l.includes('te')) {
      return `**నేల విశ్లేషణ & పంటల సిఫార్సు (pH 6.5 - 7.0)** 🌱

**సిఫార్సు చేసిన పంటలు:**
- 🌾 **వరి (Rice)** — బంకమన్ను మరియు ఒండ్రు నేలలకు అత్యుత్తమం
- 🌽 **మొక్కజొన్న (Maize)** — నీటి పారుదల ఉన్న నేలల్లో అధిక దిగుబడి
- 🥜 **వేరుశనగ (Groundnut)** — లూజ్ నేలలకు అనుకూలం

**నేల సారవంత యాజమాన్యం:**
1. పశువుల ఎరువు (FYM 3-5 టన్నులు/ఎకరానికి) వేసి సేంద్రీయ కర్బనాన్ని పెంచండి.
2. నైట్రోజన్ ఎరువులను 2-3 దఫాలుగా విభజించి వేయండి.`;
    }
    if (l.includes('tamil') || l.includes('ta')) {
      return `**மண் பகுப்பாய்வு & பயிர் பரிந்துரை (pH 6.5 - 7.0)** 🌱

**பரிந்துரைக்கப்பட்ட பயிர்கள்:**
- 🌾 **நெல் (Rice)** — களிமண் மற்றும் வண்டல் மண்ணிற்கு மிக ஏற்றது
- 🌽 **சோளம் (Maize)** — நல்ல வடிகால் வசதியுள்ள மணல் வண்டல் மண்ணில் அதிக விளைச்சல் தரும்
- 🥜 **நிலக்கடலை (Groundnut)** — காற்றோட்டமுள்ள மண்ணிற்கு ஏற்றது

**மண் வள மேலாண்மை:**
1. தொழு உரம் (FYM 3-5 டன்/ஏக்கர்) சேர்த்து மண் வளத்தை உயர்த்தவும்.
2. நைட்ரஜன் உரங்களை 2-3 பிரிவுகளாகப் பிரித்து இடவும்.`;
    }
    if (l.includes('hindi') || l.includes('hi')) {
      return `**मृदा विश्लेषण एवं फसल सिफारिश (pH 6.5 - 7.0)** 🌱

**अनुशंसित फसलें:**
- 🌾 **धान** — दोमट और चिकनी मिट्टी के लिए उत्तम
- 🌽 **मक्का** — बलुई दोमट मिट्टी में उच्च पैदावार
- 🥜 **मूंगफली** — हल्की भुरभुरी मिट्टी के लिए उपयुक्त

**मृदा प्रबंधन:**
1. गोबर की खाद (3-5 टन/एकड़) मिलाकर मिट्टी की जैविक क्षमता बढ़ाएं।
2. नाइट्रोजन यूरिया को 2-3 बार में बांटकर दें।`;
    }
    if (l.includes('kannada') || l.includes('kn')) {
      return `**ಮಣ್ಣಿನ ವಿಶ್ಲೇಷಣೆ ಮತ್ತು ಬೆಳೆ ಶಿಫಾರಸು (pH 6.5 - 7.0)** 🌱

**ಶಿಫಾರಸು ಮಾಡಿದ ಬೆಳೆಗಳು:**
- 🌾 **ಭತ್ತ (Rice)**
- 🌽 **ಮೆಕ್ಕೆಜೋಳ (Maize)**
- 🥜 **ಕಡಲೆಕಾಯಿ (Groundnut)**.`;
    }
    if (l.includes('malayalam') || l.includes('ml')) {
      return `**മണ്ണ് പരിശോധനയും വിള ശുപാർശയും (pH 6.5 - 7.0)** 🌱

**അനുയോജ്യമായ വിളകൾ:**
- 🌾 **നെല്ല് (Rice)**
- 🌽 **ചോളം (Maize)**
- 🥜 **നിലക്കടല (Groundnut)**.`;
    }
    return `**Soil Analysis & Crop Suitability Advisory** 🌱

**Recommended Crops (pH 6.5 - 7.0):**
- 🌾 **Rice** — Excellent match for clay & loam soils
- 🌽 **Maize** — High yield potential in well-drained sandy loam
- 🥜 **Groundnut** — Ideal for loose, well-aerated soil

**Soil Management:**
1. Add Farm Yard Manure (3-5 tons/acre) to boost soil organic matter.
2. Apply Nitrogen in split doses to reduce nutrient leaching.`;
  }

  // 4. GREETINGS
  if (l.includes('telugu') || l.includes('te')) {
    return `**నమస్తే! నేను మీ AgroAI వ్యవసాయ అసిస్టెంట్** 🌱

మీ పంటలు మరియు వ్యవసాయ సందేహాలకు సహాయం చేయడానికి నేను ఇక్కడ ఉన్నాను:
- 🌾 **పంటల సిఫార్సులు** (నేల pH మరియు NPK ఆధారంగా)
- 🧪 **ఎరువుల యాజమాన్యం** (DAP, Urea, MOP మోతాదులు)
- 🐛 **పంట తెగుళ్ల గుర్తింపు & నివారణ**
- ☁️ **వాతావరణం & నీటి యాజమాన్యం**

మీ సందేహాన్ని ఇక్కడ టైప్ చేయండి!`;
  }

  if (l.includes('tamil') || l.includes('ta')) {
    return `**வணக்கம்! நான் உங்கள் AgroAI விவசாய உதவியாளர்** 🌱

உங்கள் பயிர்கள் மற்றும் விவசாய கேள்விகளுக்கு உதவ தயாராக உள்ளேன்:
- 🌾 **பயிர் பரிந்துரைகள்** (மண் pH மற்றும் NPK அடிப்படையில்)
- 🧪 **உர மேலாண்மை** (DAP, Urea, MOP அளவுகள்)
- 🐛 **பயிர் நோய் கண்டறிதல் & நிவாரணம்**
- ☁️ **வானிலை & பாசன ஆலோசனைகள்**

உங்கள் கேள்விகளைத் தயங்காமல் கேட்கவும்!`;
  }

  if (l.includes('hindi') || l.includes('hi')) {
    return `**नमस्ते! मैं आपका AgroAI कृषि सहायक हूँ** 🌱

मैं आपकी खेती और फसलों से संबंधित प्रश्नों में सहायता कर सकता हूँ:
- 🌾 **फसल सिफारिशें** (मिट्टी के pH और NPK के आधार पर)
- 🧪 **उर्वरक प्रबंधन** (DAP, Urea, MOP मात्रा)
- 🐛 **पौधों की बीमारी की पहचान एवं उपचार**
- ☁️ **मौसम एवं सिंचाई सलाह**

अपना प्रश्न यहां लिखें!`;
  }

  if (l.includes('kannada') || l.includes('kn')) {
    return `**ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ AgroAI ಕೃಷಿ ಸಹಾಯಕ** 🌱

ನಿಮ್ಮ ಕೃಷಿ ಪ್ರಶ್ನೆಗಳಿಗೆ ಸಹಾಯ ಮಾಡಲು ಇಲ್ಲಿದ್ದೇನೆ:
- 🌾 **ಬೆಳೆ ಶಿಫಾರಸುಗಳು**
- 🧪 **ರಸಗೊಬ್ಬರ ನಿರ್ವಹಣೆ**
- ☁️ **ಹವಾಮಾನ ಆಧಾರಿತ ಕೃಷಿ ಸಲಹೆ**

ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಇಲ್ಲಿ ಟೈಪ್ ಮಾಡಿ!`;
  }

  if (l.includes('malayalam') || l.includes('ml')) {
    return `**നമസ്കാരം! ഞാൻ നിങ്ങളുടെ AgroAI കാർഷിക സഹായിയാണ്** 🌱

നിങ്ങളുടെ കൃഷി സംശയങ്ങൾക്ക് മറുപടി നൽകാൻ ഞാൻ ഇവിടെയുണ്ട്:
- 🌾 **വിള ശുപാർശകൾ**
- 🧪 **വളപ്രയോഗം**
- ☁️ **കാലാവസ്ഥാ മുന്നറിയിപ്പുകൾ**

നിങ്ങളുടെ ചോദ്യം താഴെ ടൈപ്പ് ചെയ്യുക!`;
  }

  if (l.includes('marathi') || l.includes('mr')) {
    return `**नमस्कार! मी तुमचा AgroAI कृषी सहाय्यक आहे** 🌱

मी तुमच्या शेतीविषयक प्रश्नांमध्ये मदत करण्यास तयार आहे:
- 🌾 **पीक शिफारसी**
- 🧪 **खत व्यवस्थापन**
- ☁️ **हवामान आणि शेती सल्ला**

तुमचा प्रश्न येथे टाईप करा!`;
  }

  if (l.includes('bengali') || l.includes('bn')) {
    return `**নমস্কার! আমি আপনার AgroAI কৃষি সহকারী** 🌱

আপনার কৃষি সম্পর্কিত প্রশ্নের উত্তর দিতে সাহায্য করতে পারি:
- 🌾 **ফসল সুপারিশ**
- 🧪 **সার ব্যবস্থাপনা**
- ☁️ **আবহাওয়া পূর্বাভাস**

আপনার প্রশ্ন এখানে লিখুন!`;
  }

  if (l.includes('gujarati') || l.includes('gu')) {
    return `**નમસ્તે! હું તમારો AgroAI કૃષિ સહાયક છું** 🌱

તમારા ખેતી પ્રશ્નોના ઉત્તર આપવા માટે તૈયાર છું:
- 🌾 **પાક ભલામણ**
- 🧪 **ખાતર વ્યવસ્થાપન**
- ☁️ **હવામાન સલાહ**

તમારો પ્રશ્ન અહીં લખો!`;
  }

  if (l.includes('punjabi') || l.includes('pa')) {
    return `**ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ! ਮੈਂ ਤੁਹਾਡਾ AgroAI ਖੇਤੀਬਾੜੀ ਸਹਾਇਕ ਹਾਂ** 🌱

ਖੇਤੀਬਾੜੀ ਅਤੇ ਫ਼ਸਲਾਂ ਦੇ ਸਵਾਲਾਂ ਵਿੱਚ ਤੁਹਾਡੀ ਮਦਦ ਕਰਨ ਲਈ ਤਿਆਰ ਹਾਂ:
- 🌾 **ਫ਼ਸਲ ਸਿਫਾਰਸ਼ਾਂ**
- 🧪 **ਖਾਦ ਪ੍ਰਬੰਧਨ**
- ☁️ **ਮੌਸਮ ਦੀ ਜਾਣਕਾਰੀ**

ਆਪਣਾ ਸਵਾਲ ਇੱਥੇ ਲਿਖੋ!`;
  }

  return `**Hello! I am your AI Agriculture & Soil Health Assistant** 🌱

To get the best yield, maintain balanced N-P-K nutrient application (typically 120-60-40 kg/ha for cereals), keep soil pH between 6.0 and 7.5, and ensure timely irrigation. You can use our Soil Health & Crop Recommendation modules for personalized farm analysis!`;
}

export async function sendChatMessage(question: string, prediction_history_id?: number, targetLanguage?: string): Promise<ChatResponse> {
  const localAns = getAgronomicAiResponse(question, targetLanguage);

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Backend timeout')), 30000)
  );

  const fetchPromise = (async () => {
    const res = await request<ChatResponse>('/chat', {
      method: 'POST',
      body: JSON.stringify({ question, prediction_history_id }),
    });
    if (res && (res.assistant_response || res.response)) {
      const raw = res.assistant_response || res.response || '';
      return { response: raw, assistant_response: raw };
    }
    throw new Error('Invalid backend response format');
  })();

  try {
    const res = await Promise.race([fetchPromise, timeoutPromise]);
    return res;
  } catch (err) {
    console.warn('Backend chat API notice (using local agronomic AI engine):', err);
  }

  return {
    response: localAns,
    assistant_response: localAns,
  };
}

// ── Weather APIs ───────────────────────────────────────────
export interface WeatherCurrent {
  location: string;
  current_temperature: number;
  feels_like: number;
  condition: string;
  humidity: number;
  wind_speed: number;
  precipitation: number;
  uv_index: number;
  visibility: number;
  icon: string;
  icon_url: string;
}

export interface WeatherForecast {
  location: string;
  forecast: Array<{
    date: string;
    day_name: string;
    min_temp: number;
    max_temp: number;
    condition: string;
    icon: string;
    icon_url: string;
  }>;
}

export async function getCurrentWeather(location = 'Telangana'): Promise<WeatherCurrent> {
  return request<WeatherCurrent>(`/weather?location=${encodeURIComponent(location)}`, { method: 'GET' });
}

export async function getWeatherForecast(location = 'Telangana'): Promise<WeatherForecast> {
  return request<WeatherForecast>(`/weather/forecast?location=${encodeURIComponent(location)}`, { method: 'GET' });
}

// ── Prediction History API ──────────────────────────────────
export interface HistoryItem {
  history_id?: number;
  id?: number | string;
  prediction_type?: string;
  type?: string;
  prediction_date?: string;
  created_at?: string;
  date?: string;
  soil_type?: string;
  predicted_crop?: string;
  top_crop?: string;
  result?: string;
  confidence?: number;
  input_data?: any;
  input?: string;
  soil_health?: string;
  soil_health_score?: number;
  soil_fertility_status?: string;
  prediction_result?: string;
  status?: string;
}

function normalizeHistoryItem(item: any): HistoryItem {
  const pType = item.type || item.prediction_type || (item.top_crop || item.predicted_crop ? 'Crop' : 'Soil');
  const normalizedType = pType.charAt(0).toUpperCase() + pType.slice(1).toLowerCase();
  const pResult = item.result || item.top_crop || item.predicted_crop || item.soil_type || item.prediction_result || 'Soil Analyzed';
  let conf = item.confidence ?? item.soil_confidence ?? item.soil_health_score ?? 95;
  if (conf <= 1) conf = Math.round(conf * 100);
  const pDate = item.date || (item.created_at || item.prediction_date ? new Date(item.created_at || item.prediction_date).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Just now');
  const pInput = item.input || (typeof item.input_data === 'string' ? item.input_data : (item.soil_type ? `Soil: ${item.soil_type}` : 'Parameters analyzed'));

  return {
    ...item,
    id: item.id || item.history_id || `P-${Math.floor(Math.random() * 10000)}`,
    type: normalizedType,
    prediction_type: normalizedType.toLowerCase(),
    result: pResult,
    confidence: conf,
    date: pDate,
    input: pInput,
    status: item.status || 'success'
  };
}

export function saveLocalPrediction(item: Partial<HistoryItem>) {
  try {
    const existing = JSON.parse(localStorage.getItem('agroai_prediction_history') || '[]')
    const rawItem: HistoryItem = {
      id: Date.now(),
      created_at: new Date().toISOString(),
      ...item,
    }
    const newItem = normalizeHistoryItem(rawItem)
    const updated = [newItem, ...existing]
    localStorage.setItem('agroai_prediction_history', JSON.stringify(updated))
    window.dispatchEvent(new Event('predictionCreated'))
  } catch (err) {
    console.warn('saveLocalPrediction error:', err)
  }
}

export async function getPredictionHistory(): Promise<HistoryItem[]> {
  const localItems: HistoryItem[] = (() => {
    try {
      const raw = JSON.parse(localStorage.getItem('agroai_prediction_history') || '[]')
      return Array.isArray(raw) ? raw.map(normalizeHistoryItem) : []
    } catch {
      return []
    }
  })()

  let combined: HistoryItem[] = [...localItems]

  try {
    const serverItems = await request<HistoryItem[]>('/history', { method: 'GET' })
    if (Array.isArray(serverItems) && serverItems.length > 0) {
      const normalizedServer = serverItems.map(normalizeHistoryItem)
      const localIds = new Set(localItems.map((i: any) => String(i.id || i.history_id)))
      const filteredServer = normalizedServer.filter((i: any) => !localIds.has(String(i.id || i.history_id)))
      combined = [...localItems, ...filteredServer]
    }
  } catch {
    // If server history API unavailable or empty, use local items
  }

  // Sort descending by date (newest prediction on top)
  combined.sort((a, b) => {
    const timeA = new Date(a.created_at || a.prediction_date || a.date || a.id || 0).getTime()
    const timeB = new Date(b.created_at || b.prediction_date || b.date || b.id || 0).getTime()
    return timeB - timeA
  })

  return combined
}

export async function getHistoryDetail(id: number): Promise<any> {
  return request<any>(`/history/${id}`, { method: 'GET' });
}

//  Community API 
export interface CommunityPost {
  id: number;
  author: { name: string; avatar: string; location: string; followers: number };
  time: string;
  content: string;
  image?: string;
  tags: string[];
  likes: number;
  comments: number;
  isLiked: boolean;
  isSaved: boolean;
}

export async function getCommunityPosts(): Promise<CommunityPost[]> {
  try {
    return await request<CommunityPost[]>('/community/posts', { method: 'GET' });
  } catch (error) {
    console.warn('Community backend unavailable, using local storage fallback.', error);
    const localPosts = JSON.parse(localStorage.getItem('agroai_community_posts') || '[]');
    return localPosts;
  }
}

export async function createCommunityPost(post: Partial<CommunityPost>): Promise<CommunityPost> {
  try {
    return await request<CommunityPost>('/community/posts', {
      method: 'POST',
      body: JSON.stringify(post),
    });
  } catch (error) {
    console.warn('Community backend unavailable, saving to local storage fallback.', error);
    const newPost: CommunityPost = {
      id: Date.now(),
      author: post.author || { name: 'Anonymous', avatar: 'AN', location: 'Unknown', followers: 0 },
      time: 'Just now',
      content: post.content || '',
      image: post.image,
      tags: post.tags || [],
      likes: 0,
      comments: 0,
      isLiked: false,
      isSaved: false,
      ...post,
    };
    const localPosts = JSON.parse(localStorage.getItem('agroai_community_posts') || '[]');
    const updated = [newPost, ...localPosts];
    localStorage.setItem('agroai_community_posts', JSON.stringify(updated));
    return newPost;
  }
}

export async function toggleCommunityPostLike(id: number, isLiked: boolean): Promise<void> {
  try {
    await request(`/community/posts/${id}/like`, { method: 'POST', body: JSON.stringify({ like: isLiked }) });
  } catch (error) {
    console.warn('Community backend unavailable, saving like to local storage fallback.', error);
    const localPosts = JSON.parse(localStorage.getItem('agroai_community_posts') || '[]');
    const updated = localPosts.map((p: any) => p.id === id ? { ...p, isLiked, likes: isLiked ? p.likes + 1 : p.likes - 1 } : p);
    localStorage.setItem('agroai_community_posts', JSON.stringify(updated));
  }
}

// ── Feedback API ───────────────────────────────────────────
export async function submitFeedback(rating: number, comment: string): Promise<{ id: number; message?: string }> {
  return request<{ id: number; message?: string }>('/feedback', {
    method: 'POST',
    body: JSON.stringify({ rating, comment }),
  });
}

// ── Admin & Analytics APIs ──────────────────────────────────
export interface AdminStats {
  total_users: number;
  active_today: number;
  total_predictions: number;
  farmer_count: number;
  feedback_received: number;
}

export async function getAdminStats(): Promise<AdminStats> {
  return request<AdminStats>('/admin/dashboard/summary', { method: 'GET' });
}

export async function getAdminUsers(): Promise<any[]> {
  return request<any[]>('/admin/users', { method: 'GET' });
}

export async function updateAdminUser(userId: number, data: { role?: string; status?: string }): Promise<any> {
  return request<any>(`/admin/users/${userId}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteAdminUser(userId: number): Promise<any> {
  return request<any>(`/admin/users/${userId}`, { method: 'DELETE' });
}

export async function getUserAnalytics(): Promise<any> {
  return request<any>('/analytics/dashboard', { method: 'GET' });
}

// ── Notification APIs ──────────────────────────────────────
export interface AppNotification {
  id: string;
  title: string;
  desc: string;
  time: string;
  type: string;
  read: boolean;
}

export async function getNotifications(): Promise<AppNotification[]> {
  return request<AppNotification[]>('/notifications', { method: 'GET' });
}

export async function markNotificationRead(id: string): Promise<any> {
  return request<any>(`/notifications/${id}/read`, { method: 'POST' });
}

export async function markAllNotificationsRead(): Promise<any> {
  return request<any>('/notifications/read-all', { method: 'POST' });
}

export const api = {
  get: <T = any>(url: string, config?: any) => request<T>(url, { method: 'GET', ...(config || {}) }).then(data => ({ data })),
  post: <T = any>(url: string, body?: any, config?: any) => request<T>(url, { method: 'POST', body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined), ...(config || {}) }).then(data => ({ data })),
  put: <T = any>(url: string, body?: any, config?: any) => request<T>(url, { method: 'PUT', body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined), ...(config || {}) }).then(data => ({ data })),
  patch: <T = any>(url: string, body?: any, config?: any) => request<T>(url, { method: 'PATCH', body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined), ...(config || {}) }).then(data => ({ data })),
  delete: <T = any>(url: string, config?: any) => request<T>(url, { method: 'DELETE', ...(config || {}) }).then(data => ({ data })),
};

export default api;
