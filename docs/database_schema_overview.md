# AgroAI Database Schema Overview

This document describes the SQLite database schema and entities for the AgroAI platform.

---

## 1. Entities & Fields

### `users`
Represents users (farmers and admin accounts).
* `id`: Integer (Primary Key, Autoincrement)
* `username`: String (Unique, Indexed)
* `email`: String (Unique, Indexed)
* `password_hash`: String
* `role`: String (e.g. `'farmer'`, `'admin'`)
* `region`: String
* `language_id`: Integer
* `is_active`: Boolean
* `created_at`: DateTime

### `prediction_history`
Maintains user prediction logs for soil classifications.
* `id`: Integer (Primary Key, Autoincrement)
* `user_id`: Integer (Foreign Key -> `users.id`)
* `soil_type`: String
* `confidence`: Float
* `recommended_crops`: JSON/String
* `weather_info`: JSON/String
* `created_at`: DateTime

### `general_history`
Stores a central registry of all user events (12 categories: profile updates, community memberships, weather lookups, crop, fertilizer, disease predictions, etc.) for E2E auditing.
* `id`: Integer (Primary Key, Autoincrement)
* `user_id`: Integer (Foreign Key -> `users.id`)
* `prediction_type`: String (e.g. `'crop'`, `'fertilizer'`, `'disease'`, `'community'`, `'login_activity'`)
* `input_parameters`: JSON/String
* `prediction_result`: JSON/String
* `confidence`: Float
* `created_at`: DateTime

### `feedbacks`
Stores feedback comments and prediction accuracy scores logged by users.
* `id`: Integer (Primary Key, Autoincrement)
* `user_id`: Integer (Foreign Key -> `users.id`)
* `rating`: Integer (e.g. `5 = Correct`, `1 = Incorrect`)
* `comment`: String
* `category`: String (e.g. `'soil_crop_recommendation'`, `'disease_detection'`)
* `created_at`: DateTime
