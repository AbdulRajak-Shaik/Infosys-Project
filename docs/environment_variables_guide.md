# AgroAI Environment Variables Guide

This document describes the environment variables required to run the AgroAI backend server.

---

## 1. Key Configuration Settings

| Variable | Description | Default Value | Required in Production |
|---|---|---|---|
| `ENV` | Environment mode (`development` or `production`) | `development` | Yes |
| `DATABASE_URL` | SQLAlchemy connection string | `sqlite:///./agroai.db` | Yes (e.g. Postgres link) |
| `SECRET_KEY` | JWT signing security key | `default-dev-secret-key` | Yes |
| `SARVAM_API_KEY` | Sarvam AI translation API key | `mock-sarvam-key` | Yes |
| `OPENWEATHER_API_KEY` | Weather forecast lookup API key | `mock-weather-key` | Yes |

---

## 2. Configuration File (.env Example)
Create a `.env` file in the root directory:
```env
ENV=production
DATABASE_URL=postgresql://agro_admin:P@ssword123@localhost:5432/agroai
SECRET_KEY=e8392bd038fa8cfd82910fa982a7f8e329048a8f
SARVAM_API_KEY=api_key_sarvam_live_9481
OPENWEATHER_API_KEY=openweather_key_live_2894
```
