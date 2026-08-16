# AgroAI Installation Guide

This guide details the steps to set up and run the AgroAI platform locally on your machine.

---

## 1. System Requirements
* **Python**: Python 3.10 or higher.
* **Node.js**: Node.js 18.x or higher (npm 9.x+).
* **Database**: SQLite (default for development/testing).

---

## 2. Backend Setup (FastAPI)
1. Navigate to the backend directory:
   ```cd AI-Based-Soil-Health-Assessment-System-for-Nutrient-Deficiency-Detection-and-Crop-Recom_Jun_2026-Backend-Team2```
2. Create a virtual environment:
   ```python -m venv .venv```
3. Activate the virtual environment:
   * **Windows (PowerShell)**: `.venv\Scripts\Activate.ps1`
   * **Linux / macOS**: `source .venv/bin/activate`
4. Install dependencies:
   ```pip install -r requirements.txt```
5. Seed the database with initial classifications, recommendations, and translations:
   ```python seed_database.py```
6. Start the backend development server:
   ```uvicorn app.main:app --reload```
   The API will be live at `http://127.0.0.1:8000`.

---

## 3. Frontend Setup (React + TypeScript)
1. Navigate to the frontend directory:
   ```cd ../AI-Based-Soil-Health-Assessment-System-for-Nutrient-Deficiency-Detection-and-Crop-Recom_Jun_2026-frontend-team-1```
2. Install npm dependencies:
   ```npm install```
3. Start the Vite development server:
   ```npm run dev```
   The application will be live at `http://localhost:5173`.
