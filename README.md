# 🌱 AI-Based Soil Health Assessment System
### Nutrient Deficiency Detection & Crop Recommendation using EfficientNetB0

## 📌 Overview

The AI-Based Soil Health Assessment System is a deep learning-powered application that analyzes soil images to identify soil types and detect nutrient deficiencies. Based on the analysis, the system provides soil health assessment, fertilizer recommendations, and suitable crop suggestions to support precision agriculture.

The project uses **EfficientNetB0** with Transfer Learning for soil image classification and is designed to be integrated with a mobile-friendly web application for farmers.

---

## 🎯 Objectives

- Detect soil nutrient deficiencies from soil images.
- Classify soil into predefined categories.
- Recommend appropriate fertilizers.
- Suggest suitable crops based on soil condition.
- Support sustainable farming using AI.

---

## 🚀 Features

- 📷 Soil Image Classification
- 🧠 Deep Learning using EfficientNetB0
- 🔄 Transfer Learning
- 🎨 Image Preprocessing & Data Augmentation
- 📊 Training & Validation Accuracy Visualization
- 📉 Loss Curve Analysis
- 📈 Confusion Matrix
- 🎯 Model Evaluation
- 💾 Trained Model Saving
- 🔍 Prediction on New Soil Images

---

## 🛠️ Tech Stack

### Programming Language
- Python 3.x

### Deep Learning
- TensorFlow
- Keras
- EfficientNetB0

### Image Processing
- OpenCV
- Pillow

### Data Handling
- NumPy
- Pandas

### Visualization
- Matplotlib
- Seaborn

### Evaluation
- Scikit-learn

---

## 📂 Dataset

The dataset consists of labeled soil images collected from publicly available agricultural datasets and open-source repositories.

Dataset Structure:

```
Dataset/
│
├── Train/
│   ├── Class_1/
│   ├── Class_2/
│   ├── ...
│
├── Validation/
│   ├── Class_1/
│   ├── Class_2/
│
└── Test/
    ├── Class_1/
    ├── Class_2/
```

---

## 🧹 Data Preprocessing

The following preprocessing techniques were applied:

- Image resizing (224 × 224)
- Pixel normalization
- Data augmentation
- Image validation
- Dataset splitting

---

## 🧠 Model Architecture

The project uses **EfficientNetB0** with Transfer Learning.

### Workflow

```
Input Image
      │
      ▼
Image Preprocessing
      │
      ▼
EfficientNetB0 Backbone
      │
      ▼
Global Average Pooling
      │
      ▼
Dense Layer
      │
      ▼
Dropout
      │
      ▼
Softmax Classifier
      │
      ▼
Prediction
```

---

## ⚙️ Training Details

- Model: EfficientNetB0
- Transfer Learning
- Optimizer: Adam
- Loss Function: Categorical Crossentropy
- Evaluation Metric: Accuracy
- Early Stopping
- Model Checkpoint
- Learning Rate Scheduler

---

## 📊 Model Evaluation

The trained model is evaluated using:

- Accuracy
- Loss
- Precision
- Recall
- F1-Score
- Confusion Matrix
- Classification Report

---

## 📈 Training Pipeline

```
Collect Dataset
        │
        ▼
Image Preprocessing
        │
        ▼
Data Augmentation
        │
        ▼
Train EfficientNetB0
        │
        ▼
Validate Model
        │
        ▼
Test Model
        │
        ▼
Save Best Model
        │
        ▼
Predict New Images
```

---

## 📁 Project Structure

```
AI-Based-Soil-Health-Assessment/

│── dataset/
│── models/
│── notebooks/
│── outputs/
│── predictions/
│── utils/
│── train.py
│── predict.py
│── requirements.txt
│── README.md
```

---

## 📷 Prediction Workflow

```
Soil Image
      │
      ▼
Preprocessing
      │
      ▼
EfficientNetB0 Model
      │
      ▼
Soil Classification
      │
      ▼
Nutrient Deficiency Detection
      │
      ▼
Fertilizer Recommendation
      │
      ▼
Crop Recommendation
```

---

## 🔮 Future Enhancements

- Integration with FastAPI
- Mobile-first Progressive Web App (PWA)
- Real-time camera prediction
- Multilingual support
- Soil health trend analysis
- Explainable AI using Grad-CAM
- Cloud deployment

---

## 📚 Libraries Used

- TensorFlow
- Keras
- OpenCV
- NumPy
- Pandas
- Matplotlib
- Scikit-learn
- Pillow

---

## 📄 License

This project is developed for educational and research purposes.
