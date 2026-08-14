import sqlite3
import os
import random
from datetime import datetime, timedelta

db_path = os.path.join(os.path.dirname(__file__), "soil_health.db")
print(f"Connecting to database at: {db_path}")
conn = sqlite3.connect(db_path)
c = conn.cursor()

# 1. Run migrations to ensure columns exist in SQLite
c.execute("PRAGMA table_info(feedback)")
feedback_cols = [col[1] for col in c.fetchall()]
print("Current feedback columns:", feedback_cols)

if "category" not in feedback_cols:
    print("Altering table feedback: adding category column...")
    c.execute("ALTER TABLE feedback ADD COLUMN category TEXT")
if "admin_response" not in feedback_cols:
    print("Altering table feedback: adding admin_response column...")
    c.execute("ALTER TABLE feedback ADD COLUMN admin_response TEXT")
if "is_resolved" not in feedback_cols:
    print("Altering table feedback: adding is_resolved column...")
    c.execute("ALTER TABLE feedback ADD COLUMN is_resolved INTEGER DEFAULT 0")

conn.commit()

# 2. Reset/Clear existing dynamic dashboard tables to seed fresh operational data
print("Purging existing dynamic records to prepare clean seeding...")
c.execute("DELETE FROM chat_history")
c.execute("DELETE FROM feedback")
c.execute("DELETE FROM prediction_history")
# Keep default seed users, but we will update them or insert fresh users
# Let's clean all users except the default admin to keep login session valid
c.execute("DELETE FROM users WHERE email != 'admin@example.com'")
conn.commit()

# 3. Seed users
# User format: (id, username, email, hashed_password, role, status, region, language_id, created_at, updated_at)
# Password hash for 'FarmerPass123!' is '$2b$12$7kP.Lg.p9.K9/9jP2.jWGu8qS5d/hE1fH1U3wUf.v.YJb5YJ.J5YJ' (mock bcrypt)
# We will use pre-hashed password: '$2b$12$R.S4oG/98hO7aMvJ7b5HGeZ9B14L8f/hE1fH1U3wUf.v.YJb5YJ.J5YJ'
hashed_pass = "$2b$12$R.S4oG/98hO7aMvJ7b5HGeZ9B14L8f/hE1fH1U3wUf.v.YJb5YJ.J5YJ"

user_data = [
    # Username, Email, Role, Status, Region, Language_id, Created MonthOffset
    ("Ramesh Kumar", "ramesh@example.com", "farmer", "active", "Punjab", 1, -180), # 6 months ago
    ("Suresh Patel", "suresh@example.com", "farmer", "active", "Gujarat", 2, -150),
    ("Anil Naidu", "anil@example.com", "farmer", "active", "Nellore", 3, -120),
    ("Madan Murmu", "madan@example.com", "farmer", "active", "Jharkhand", 16, -90), # Santali user
    ("Lalita Devi", "lalita@example.com", "farmer", "active", "Uttar Pradesh", 2, -80),
    ("Karan Singh", "karan@example.com", "farmer", "active", "Rajasthan", 1, -70),
    ("Sunita Gowda", "sunita@example.com", "farmer", "active", "Karnataka", 5, -60),
    ("Venkat Rao", "venkat@example.com", "farmer", "active", "Andhra Pradesh", 3, -50),
    ("Bodo Kisku", "bodo@example.com", "farmer", "active", "Assam", 17, -45), # Bodo user
    ("Ram Murthy", "ram@example.com", "farmer", "suspended", "Nellore", 3, -40),
    ("Jyoti Patil", "jyoti@example.com", "farmer", "active", "Maharashtra", 7, -30),
    ("Subhash Chandra", "subhash@example.com", "farmer", "inactive", "West Bengal", 9, -20),
    ("Amit Sharma", "amit@example.com", "farmer", "active", "Haryana", 1, -15),
    ("Rajesh Reddy", "rajesh@example.com", "farmer", "active", "Telangana", 3, -10),
    ("Pooja Hegde", "pooja@example.com", "farmer", "active", "Karnataka", 5, -5),
]

now = datetime.now()
inserted_users = []

for name, email, role, status, region, lang_id, offset in user_data:
    created_at = (now + timedelta(days=offset)).strftime("%Y-%m-%d %H:%M:%S")
    c.execute(
        """INSERT INTO users (username, email, hashed_password, role, status, region, language_id, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (name, email, hashed_pass, role, status, region, lang_id, created_at, created_at)
    )
    inserted_users.append((c.lastrowid, name, role, lang_id, offset))

# Retrieve Admin user ID to link any admin replies
c.execute("SELECT id FROM users WHERE role = 'admin' LIMIT 1")
admin_id = c.fetchone()[0]

conn.commit()
print(f"Successfully seeded {len(inserted_users)} farmers into the database.")

# 4. Seed prediction history
# Fields: ['id', 'user_id', 'soil_image_path', 'soil_type', 'soil_confidence', 'nitrogen', 'phosphorus', 'potassium', 'ph', 'organic_carbon', 'electrical_conductivity', 'temperature', 'humidity', 'soil_health', 'soil_health_score', 'soil_fertility_status', 'nutrient_deficiencies', 'recommended_crops', 'recommended_fertilizers', 'created_at']
soil_types = ["Red Soil", "Black Soil", "Clay Soil", "Sandy Soil", "Loamy Soil"]
soil_health_types = ["Optimal", "Degraded", "Slightly Deficient", "Highly Acidic", "Alkaline"]
fertility_statuses = ["High Fertility", "Medium Fertility", "Low Fertility"]
crops_pool = ["Wheat", "Rice", "Cotton", "Maize", "Groundnut", "Mustard", "Sugarcane", "Jowar"]
fertilizers_pool = ["Urea", "DAP", "MOP", "Single Super Phosphate", "Compost", "Neem Cake"]

predictions_count = 120
seeded_predictions = 0

for i in range(predictions_count):
    # pick random user
    u_id, u_name, u_role, u_lang, u_offset = random.choice(inserted_users)
    
    # prediction date is after user creation
    pred_offset = random.randint(u_offset, 0)
    pred_date = (now + timedelta(days=pred_offset)).strftime("%Y-%m-%d %H:%M:%S")
    
    soil = random.choice(soil_types)
    confidence = round(random.uniform(85.0, 99.8), 2)
    n = float(random.randint(10, 140))
    p = float(random.randint(5, 90))
    k = float(random.randint(10, 250))
    ph = round(random.uniform(5.2, 8.5), 1)
    oc = round(random.uniform(0.1, 1.2), 2)
    ec = round(random.uniform(0.2, 2.5), 2)
    temp = round(random.uniform(15.0, 42.0), 1)
    humidity = round(random.uniform(30.0, 95.0), 1)
    
    health = random.choice(soil_health_types)
    health_score = float(random.randint(45, 95))
    fertility = random.choice(fertility_statuses)
    
    # Deficiencies
    deficiencies = []
    if n < 40: deficiencies.append("Nitrogen Deficiency")
    if p < 25: deficiencies.append("Phosphorus Deficiency")
    if k < 80: deficiencies.append("Potassium Deficiency")
    if ph < 6.0: deficiencies.append("Soil Acidity")
    elif ph > 7.8: deficiencies.append("Soil Alkalinity")
    
    # Recommended crops and fertilizers
    rec_crops = random.sample(crops_pool, k=3)
    rec_fert = random.sample(fertilizers_pool, k=2)
    
    import json
    c.execute(
        """INSERT INTO prediction_history (
               user_id, soil_image_path, soil_type, soil_confidence, nitrogen, phosphorus, potassium,
               ph, organic_carbon, electrical_conductivity, temperature, humidity, soil_health,
               soil_health_score, soil_fertility_status, nutrient_deficiencies, recommended_crops,
               recommended_fertilizers, created_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            u_id, f"/uploads/soil_{random.randint(1,10)}.jpg", soil, confidence, n, p, k,
            ph, oc, ec, temp, humidity, health, health_score, fertility,
            json.dumps(deficiencies), json.dumps(rec_crops), json.dumps(rec_fert), pred_date
        )
    )
    seeded_predictions += 1

conn.commit()
print(f"Successfully seeded {seeded_predictions} prediction records.")

# 5. Seed feedback
# Fields: ['id', 'user_id', 'rating', 'comment', 'created_at', 'category', 'admin_response', 'is_resolved']
feedback_pool = [
    ("Great platform! The crop recommendation is spot-on.", "general", 5, True),
    ("Chatbot is helpful but sometimes slow to translate in Santali.", "chatbot", 4, False),
    ("Soil analysis accurately detected Nitrogen deficiency in my fields.", "soil", 5, True),
    ("The local weather forecast matches my Nellore village conditions perfectly.", "weather", 5, True),
    ("Simple interface, very easy to use in Telugu language.", "ux", 5, True),
    ("Wish there were more fertilizer dosage details.", "crop", 4, False),
    ("The disease prediction module identified leaf rust correctly.", "disease", 5, True),
    ("Could not fetch weather location automatically first time.", "weather", 3, False),
    ("Amazing translations! Feels like local app.", "ux", 5, True),
    ("Nice chatbot answers for corn planting advice.", "chatbot", 4, True),
    ("Need support for Hindi voice inputs.", "general", 3, False),
    ("High accuracy on red soil classification.", "soil", 5, True),
]

seeded_feedback = 0
for comment, cat, rating, resolved in feedback_pool:
    # Pick random user
    u_id, u_name, u_role, u_lang, u_offset = random.choice(inserted_users)
    feed_offset = random.randint(u_offset, 0)
    feed_date = (now + timedelta(days=feed_offset)).strftime("%Y-%m-%d %H:%M:%S")
    
    admin_rep = None
    if resolved:
        admin_rep = f"Thank you {u_name}! We are glad AgroAI was helpful. We will continue improving our {cat} models."
        
    c.execute(
        """INSERT INTO feedback (user_id, rating, comment, category, admin_response, is_resolved, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        (u_id, rating, comment, cat, admin_rep, 1 if resolved else 0, feed_date)
    )
    seeded_feedback += 1

conn.commit()
print(f"Successfully seeded {seeded_feedback} feedback reviews.")

# 6. Seed chat history
# Fields: ['id', 'user_id', 'prediction_history_id', 'user_message', 'question_language', 'preferred_language', 'assistant_response', 'created_at']
chats = [
    ("How do I fix nitrogen deficiency in wheat?", "en", "Apply nitrogenous fertilizers like urea or ammonium sulfate in splits."),
    ("टमाटर के पौधों में पत्ती मरोड़ रोग का उपचार क्या है?", "hi", "पत्ती मरोड़ रोग वायरस के कारण होता है। संक्रमित पौधों को हटा दें और नीम के तेल का छिड़काव करें।"),
    ("వరి పంటకు ఎంత యూరిया వేయాలి?", "te", "ఎకరాకు సుమారు 100-120 కిలోల యూరియాను మూడు విడతలుగా వేయాలి."),
    ("சந்தாலி மொழியில் மண் பரிசோதனை செய்ய முடியுமா?", "ta", "ஆமாம், அக்ரோஏஐ சந்தாலி மொழியில் மண் பரிசோதனை முடிவுகளை வழங்குகிறது."),
    ("ᱮᱨᱟᱜ ᱦᱳᱲᱳ ᱫᱟᱨᱮ ᱨᱮ ᱪᱮᱫ ᱥᱟᱨ ᱮᱢᱚᱜ ᱞᱟᱹᱠᱛᱤ ᱠᱟᱱᱟ?", "sat", "ᱦᱳᱲᱳ ᱫᱟᱨᱮ ᱨᱮ ᱱᱟᱭᱴᱨᱳᱡᱮᱱ (ᱭᱩᱨᱤᱭᱟ), ᱯᱷᱚᱥᱯᱷᱚᱨᱟᱥ (ᱰᱤ.ᱮ.ᱯᱤ.) ᱟᱨ ᱯᱳᱴᱟᱥ ᱥᱟᱨ ᱮᱢ ᱢᱮᱰ ᱟᱨ ᱥᱚᱢᱚᱭ ᱨᱮ ᱫᱟᱜ ᱫᱩᱞ ᱢᱮ ᱾"),
    ("Best fertilizer for red clay soil?", "en", "Red clay soil needs organic compost, DAP, and balanced NPK fertilizer (19:19:19)."),
    ("Will it rain tomorrow in Nellore?", "en", "According to weather forecast, scattered light showers are expected tomorrow afternoon."),
    ("धान की उपज बढ़ाने के लिए उपाय बताएं।", "hi", "समय पर सिंचाई करें, स्वस्थ बीजों का उपयोग करें और मिट्टी परीक्षण के अनुसार एनपीके खादों का प्रयोग करें।"),
    ("Bodo language support exists?", "en", "Yes, Bodo is fully supported. You can change your language in settings."),
]

seeded_chats = 0
for q, lang_code, ans in chats:
    # Pick random user
    u_id, u_name, u_role, u_lang, u_offset = random.choice(inserted_users)
    chat_offset = random.randint(u_offset, 0)
    chat_date = (now + timedelta(days=chat_offset)).strftime("%Y-%m-%d %H:%M:%S")
    
    c.execute(
        """INSERT INTO chat_history (user_id, user_message, question_language, preferred_language, assistant_response, created_at)
           VALUES (?, ?, ?, ?, ?, ?)""",
        (u_id, q, lang_code, lang_code, ans, chat_date)
    )
    seeded_chats += 1

conn.commit()
print(f"Successfully seeded {seeded_chats} chat conversations.")

conn.close()
print("All SQLite database alterations and seeding completed successfully!")
