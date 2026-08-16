import os
import sys
import numpy as np
import tensorflow as tf
from PIL import Image
from tensorflow.keras.applications.efficientnet import preprocess_input

model_path = "c:/infosys/AI-Based-Soil-Health-Assessment-System-for-Nutrient-Deficiency-Detection-and-Crop-Recom_Jun_2026/AI-Based-Soil-Health-Assessment-System-for-Nutrient-Deficiency-Detection-and-Crop-Recom_Jun_2026-Backend-Team2/app/ml_models/soil_classification_model.keras"
model = tf.keras.models.load_model(model_path, compile=False)

uploads_dir = "c:/infosys/AI-Based-Soil-Health-Assessment-System-for-Nutrient-Deficiency-Detection-and-Crop-Recom_Jun_2026/AI-Based-Soil-Health-Assessment-System-for-Nutrient-Deficiency-Detection-and-Crop-Recom_Jun_2026-Backend-Team2/app/uploads"
test_img = None
for f in os.listdir(uploads_dir):
    if f.lower().endswith(".jpg"):
        test_img = os.path.join(uploads_dir, f)
        break

if not test_img:
    print("No test image found!")
    sys.exit(0)

# Load and preprocess using bilinear resize (Method 2)
with Image.open(test_img) as image:
    rgb_image = image.convert("RGB")
    image_array = np.array(rgb_image, dtype=np.float32)
resized_image = tf.image.resize(image_array, size=(224, 224), method="bilinear")
resized_image = tf.cast(resized_image, tf.float32)
preprocessed_image = preprocess_input(resized_image)
processed_image = np.expand_dims(preprocessed_image.numpy(), axis=0)

raw_preds = model.predict(processed_image, verbose=0)[0]
print("Raw prediction array:", raw_preds)
print("Sum of raw predictions:", np.sum(raw_preds))
print("All values >= 0:", np.all(raw_preds >= 0))
