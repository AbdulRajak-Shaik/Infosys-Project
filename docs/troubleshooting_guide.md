# AgroAI Troubleshooting Guide

This guide describes resolutions for common issues encountered during system setup and execution.

---

## 1. Blurry or Blended Image Rejection
* **Symptoms**: The system throws a `400 Bad Request` with message: *"Image is too blurry. Please upload a sharp, in-focus photo."*
* **Root Cause**: The image uploaded fails the high-frequency pixel gradient variance check.
* **Solution**: Ensure the leaf or soil sample is captured under balanced, natural lighting, with clear focus and no hand motion blur.

---

## 2. Model Weight Files Missing
* **Symptoms**: Startup console logs show errors reading CatBoost `.cbm` files or EfficientNet-B0 weights.
* **Solution**:
  1. Verify the models are stored in:
     `AI-Based-Soil-Health-Assessment-System-for-Nutrient-Deficiency-Detection-and-Crop-Recom_Jun_2026-Backend-Team2/app/ml_models/`
  2. Run `seed_database.py` to regenerate initial fallback pickles.

---

## 3. Sarvam AI Translation Timeout
* **Symptoms**: Translation tags display fallback strings in English.
* **Solution**: Check your internet connection and verify that the `SARVAM_API_KEY` configured in `.env` is valid and has active quotas.
