# AgroAI: AI-Based Soil Health Assessment System

An enterprise-grade, highly scalable, and fully localized AI platform built with FastAPI and React to detect nutrient deficiencies, classify soil types via computer vision, recommend optimal crops, and suggest precise fertilizer schedules.

---

## 📂 Project Structure & Documentation

We have provided a complete suite of documentation guides for administrators, developers, and final submission evaluations:

* **🛠️ [Installation Guide](docs/installation_guide.md)**: Setup and run the backend and frontend locally.
* **🌐 [Deployment Guide](docs/deployment_guide.md)**: Configure production servers, uvicorn workers, and Nginx.
* **⚡ [API Documentation](docs/api_documentation.md)**: Overview of REST routes, payload schemas, and model endpoints.
* **🗃️ [Database Schema](docs/database_schema_overview.md)**: SQLite/PostgreSQL entity relationship structures.
* **⚙️ [Environment Variables Guide](docs/environment_variables_guide.md)**: Guide to config parameters.
* **📖 [User Manual](docs/user_manual.md)**: Step-by-step user guide for farmers to classify soil and get recommendations.
* **🛡️ [Admin Manual](docs/admin_manual.md)**: Administrator manual to inspect live health monitors, observability, and feedback.
* **🔍 [Troubleshooting Guide](docs/troubleshooting_guide.md)**: Common errors and recovery steps.

---

## 🚀 Key Features

1. **Computer Vision classification**: Classifies soil types and disease symptoms using EfficientNet-B0.
2. **Quality-controlled File Uploads**: Validates file size, integrity, resolution, blur/focus, brightness, and contrast before processing inference vectors.
3. **Sarvam AI localization**: Full dynamic translation for all field names, options, chatbot answers, and predictions.
4. **GeneralHistory Auditing**: End-to-end tracking of 12 distinct user action categories.
5. **Obsability metrics**: Custom live health monitors measuring database connectivity, CatBoost/CNN latencies, and failed transaction counters.
