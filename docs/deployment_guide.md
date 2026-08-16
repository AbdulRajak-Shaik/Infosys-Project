# AgroAI Deployment Guide

This guide details instructions for deploying the AgroAI platform in a production environment.

---

## 1. Production Backend (FastAPI + Gunicorn)
1. Set the production environment variables:
   ```env
   ENV=production
   DATABASE_URL=postgresql://user:password@localhost:5432/agroai
   SECRET_KEY=super-secret-production-key-here
   SARVAM_API_KEY=production-sarvam-key
   OPENWEATHER_API_KEY=production-weather-key
   ```
2. Start FastAPI with Gunicorn (multiple Uvicorn workers):
   ```bash
   gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000
   ```

---

## 2. Production Frontend (Vite Build)
1. Run Vite compiler to generate production static assets:
   ```bash
   npm run build
   ```
2. Serve the static assets inside `dist/` using Nginx or an AWS S3 bucket.
3. Example Nginx server block configuring routing to fallback on index.html:
   ```nginx
   server {
       listen 80;
       server_name agroai.org;
       location / {
           root /var/www/agroai/dist;
           try_files $uri $uri/ /index.html;
       }
       location /api/ {
           proxy_pass http://localhost:8000/;
           proxy_set_header Host $host;
       }
   }
   ```
