import os
import sys
import numpy as np
import tensorflow as tf
from PIL import Image

model_path = "c:/infosys/AI-Based-Soil-Health-Assessment-System-for-Nutrient-Deficiency-Detection-and-Crop-Recom_Jun_2026/AI-Based-Soil-Health-Assessment-System-for-Nutrient-Deficiency-Detection-and-Crop-Recom_Jun_2026-Backend-Team2/app/ml_models/soil_classification_model.keras"

print("TensorFlow Version:", tf.__version__)

if not os.path.exists(model_path):
    print("Model file not found!")
    sys.exit(1)

model = tf.keras.models.load_model(model_path, compile=False)
print("Model loaded successfully.")
model.summary()

# Let's inspect layers specifically
for idx, layer in enumerate(model.layers):
    print(f"Layer {idx}: {layer.name}, Input: {layer.input_shape if hasattr(layer, 'input_shape') else 'N/A'}, Output: {layer.output_shape if hasattr(layer, 'output_shape') else 'N/A'}")
