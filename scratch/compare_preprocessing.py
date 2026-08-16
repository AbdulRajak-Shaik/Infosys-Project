import os
import numpy as np
import tensorflow as tf
from PIL import Image
from tensorflow.keras.applications.efficientnet import preprocess_input

model_path = "c:/infosys/AI-Based-Soil-Health-Assessment-System-for-Nutrient-Deficiency-Detection-and-Crop-Recom_Jun_2026/AI-Based-Soil-Health-Assessment-System-for-Nutrient-Deficiency-Detection-and-Crop-Recom_Jun_2026-Backend-Team2/app/ml_models/soil_classification_model.keras"
model = tf.keras.models.load_model(model_path, compile=False)

# Let's find a test image in the uploads directory
uploads_dir = "c:/infosys/AI-Based-Soil-Health-Assessment-System-for-Nutrient-Deficiency-Detection-and-Crop-Recom_Jun_2026/AI-Based-Soil-Health-Assessment-System-for-Nutrient-Deficiency-Detection-and-Crop-Recom_Jun_2026-Backend-Team2/app/uploads"
test_img = None
for f in os.listdir(uploads_dir):
    if f.lower().endswith(".jpg"):
        test_img = os.path.join(uploads_dir, f)
        break

if not test_img:
    print("No test image found to compare!")
    sys.exit(0)

print("Test Image:", test_img)

# Method 1: Notebook Preprocessing (PIL Resize + convert to array)
print("\n--- Method 1 (Notebook PIL Resize) ---")
img_pil = Image.open(test_img).convert("RGB").resize((224, 224))
arr_pil = np.array(img_pil, dtype=np.float32)
input_pil = np.expand_dims(arr_pil, axis=0)
pred_pil = model.predict(input_pil, verbose=0)[0]
print("Prediction:", pred_pil)
print("Argmax:", np.argmax(pred_pil))

# Method 2: Current image_preprocessing.py
print("\n--- Method 2 (Current image_preprocessing.py) ---")
with Image.open(test_img) as image:
    rgb_image = image.convert("RGB")
    image_array = np.array(rgb_image, dtype=np.float32)
resized_image = tf.image.resize(image_array, size=(224, 224), method="bilinear")
resized_image = tf.cast(resized_image, tf.float32)
preprocessed_image = preprocess_input(resized_image)
processed_image = np.expand_dims(preprocessed_image.numpy(), axis=0)
pred_pre = model.predict(processed_image, verbose=0)[0]
print("Prediction:", pred_pre)
print("Argmax:", np.argmax(pred_pre))
