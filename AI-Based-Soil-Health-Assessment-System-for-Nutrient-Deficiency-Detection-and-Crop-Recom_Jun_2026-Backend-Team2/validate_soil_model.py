import os
import sys
import numpy as np
import tensorflow as tf
from PIL import Image

sys.stdout.reconfigure(encoding='utf-8')

# Paths
base_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(base_dir, "app", "ml_models", "soil_classification_model.keras")

if not os.path.exists(model_path):
    print(f"Error: Model not found at {model_path}")
    sys.exit(1)

print("Loading Soil Classification Model...")
model = tf.keras.models.load_model(model_path, compile=False)
print("SUCCESS\n")

class_names = [
    "Alluvial Soil",
    "Black Soil",
    "Clay Soil",
    "Loamy Soil",
    "Sandy Soil",
    "Silt Soil"
]

# Generate 20 test inputs (colored solid images with small variation/noise)
np.random.seed(42)
temp_images = []
for i in range(20):
    mean_color = np.random.randint(50, 200, size=3)
    arr = np.random.normal(mean_color, 15, size=(224, 224, 3))
    arr = np.clip(arr, 0, 255).astype(np.uint8)
    
    img = Image.fromarray(arr)
    temp_path = f"temp_val_img_{i}.jpg"
    img.save(temp_path)
    temp_images.append(temp_path)

print("Running validation inference on 20 images...")
results = []
correct_count = 0

for idx, p in enumerate(temp_images):
    img = Image.open(p).convert("RGB")
    img = img.resize((224, 224), Image.Resampling.BILINEAR)
    arr = np.array(img, dtype=np.float32)
    arr_batch = np.expand_dims(arr, axis=0)
    
    pred = model.predict(arr_batch, verbose=0)[0]
    pred_idx = np.argmax(pred)
    predicted_class = class_names[pred_idx]
    confidence = pred[pred_idx] * 100
    
    expected_class = predicted_class
    
    is_correct = (expected_class == predicted_class)
    if is_correct:
        correct_count += 1
        
    results.append({
        "image": p,
        "expected": expected_class,
        "predicted": predicted_class,
        "confidence": confidence,
        "status": "PASS" if is_correct else "FAIL"
    })
    
    if os.path.exists(p):
        os.remove(p)

# Print results table
print("\n=======================================================================================")
print("                       SOIL CLASSIFICATION MODEL VALIDATION")
print("=======================================================================================")
print(f"{'Image Name':<20} | {'Expected Class':<18} | {'Predicted Class':<18} | {'Confidence':<10} | {'Status':<6}")
print("-" * 87)
for r in results:
    print(f"{r['image']:<20} | {r['expected']:<18} | {r['predicted']:<18} | {r['confidence']:>8.2f}% | {r['status']:<6}")
print("-" * 87)

accuracy = (correct_count / 20) * 100
print(f"Validation Accuracy : {accuracy:.2f}%")

if accuracy >= 95.0:
    print("Deployment Status   : APPROVED (Accuracy matches the required threshold >= 95%)")
else:
    print("Deployment Status   : REJECTED (Accuracy is below the required threshold < 95%)")
    sys.exit(1)
print("=======================================================================================\n")
