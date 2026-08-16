# AgroAI Admin Manual

This manual explains how administrators can monitor platform activity, check system health, and inspect user feedback.

---

## 1. Accessing Admin Panel
1. Log in with an administrator account.
2. Click **Admin Dashboard** in the navigation menu.

---

## 2. Live System Health & Observability
1. In the top right corner of the dashboard, click **Show System Health**.
2. This fetches live connectivity status, latency, and load metrics from:
   * **Database & Cache**: SQLite/PostgreSQL connection checks.
   * **Inference Models**: EfficientNet-B0 and CatBoost execution speeds.
   * **External Bindings**: Sarvam AI translator and OpenWeather APIs.
3. Scroll to the **Observability & Average Latencies** section to track average prediction latency (ms), failed requests, and automated retry logs.

---

## 3. Reviewing Feedback & Chatbot Logs
* Navigate to the **User Feedback** tab to view accuracy ratings (Correct/Incorrect) and comment logs submitted by farmers.
* Inspect the **Chatbot Monitoring** section to see recent user topics, questions asked, and languages used.
