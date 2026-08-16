import os
import numpy as np
import tensorflow as tf

model_path = "c:/infosys/AI-Based-Soil-Health-Assessment-System-for-Nutrient-Deficiency-Detection-and-Crop-Recom_Jun_2026/AI-Based-Soil-Health-Assessment-System-for-Nutrient-Deficiency-Detection-and-Crop-Recom_Jun_2026-Backend-Team2/app/ml_models/soil_classification_model.keras"

model = tf.keras.models.load_model(model_path, compile=False)
output_layer = model.layers[-1]
print("Output Layer Name:", output_layer.name)
print("Output Layer Activation:", output_layer.activation.__name__ if hasattr(output_layer, "activation") else "None")

# Let's run a prediction on all zeros to see the raw output values
dummy_input = np.zeros((1, 224, 224, 3), dtype=np.float32)
preds = model.predict(dummy_input, verbose=0)[0]
print("Dummy Zeros Prediction:", preds)
print("Sum of Predictions:", np.sum(preds))
