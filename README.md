# AgriAI — Offline AI Farming Intelligence & Market Discovery Platform

[![React](https://img.shields.io/badge/Frontend-React%2019%20%7C%20Vite-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%200.110+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![TensorFlow](https://img.shields.io/badge/Vision%20AI-MobileNetV2%20%7C%20TensorFlow-FF6F00?logo=tensorflow&logoColor=white)](https://tensorflow.org/)
[![Scikit-Learn](https://img.shields.io/badge/ML-Scikit--Learn-F7931E?logo=scikitlearn&logoColor=white)](https://scikit-learn.org/)
[![SQLite](https://img.shields.io/badge/Database-SQLite%203-003B57?logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![LM Studio](https://img.shields.io/badge/LLM-Phi--3%20Mini%20(LM%20Studio)-4A154B)](https://lmstudio.ai/)

**AgriAI** is an offline-capable, local-first artificial intelligence and market intelligence platform designed to empower farmers and agricultural professionals with scientific crop guidance, deep learning leaf disease diagnosis, localized conversational farming assistance, real-time meteorological intelligence, and pan-India APMC mandi wholesale price discovery — with multi-lingual accessibility (English, Kannada, Hindi) and privacy-first local data storage.

---

## 📑 Table of Contents

1. [Project Overview](#-1-project-overview)
2. [Main Features](#-2-main-features)
3. [Technology Stack](#-3-technology-stack)
4. [Project Folder Structure](#-4-project-folder-structure)
5. [Prerequisites](#-5-prerequisites)
6. [Environment Variables](#-6-environment-variables)
7. [Local Installation Steps](#-7-local-installation-steps)
8. [Backend Startup Instructions](#-8-backend-startup-instructions)
9. [Frontend Startup Instructions](#-9-frontend-startup-instructions)
10. [Testing Instructions](#-10-testing-instructions)
11. [Database Information & Schema](#-11-database-information--schema)
12. [External Service Requirements & Offline Truthfulness](#-12-external-service-requirements--offline-truthfulness)
13. [Deployment Preparation Notes](#-13-deployment-preparation-notes)
14. [Forecasting Readiness Gate & Data Integrity Policy](#-14-forecasting-readiness-gate--data-integrity-policy)

---

## 🌾 1. Project Overview

Modern farmers face critical agronomic and financial hurdles:
- **Unpredictable micro-climates** and nutrient imbalances in soil.
- **Crop pests and plant pathologies** requiring rapid identification before yield loss.
- **Limited internet connectivity** in remote agricultural belts, making cloud-only platforms inaccessible.
- **Information asymmetry in agricultural markets**, leaving farmers unaware of price disparities between local and regional APMC mandis.

**AgriAI** addresses these challenges through a unified enterprise agricultural application:
- **Local AI Inference**: Offline agronomy LLM (`phi-3-mini-4k-instruct`), Scikit-Learn soil chemistry matching, and MobileNetV2 computer vision operate locally without cloud dependencies.
- **Genuine APMC Market Intelligence**: Tracks 2,595 verified wholesale price records across 1,471 mandis in 27 states and Union Territories, providing price comparison, net profit calculations, and selling advice.
- **Readiness Gate Architecture**: Strictly enforces data quality and prevents deceptive ML price predictions until statistically sufficient longitudinal time-series data accumulates.

---

## 🌟 2. Main Features

| Feature Name | Category | Mechanism | User-Facing Component | API Endpoints |
| :--- | :--- | :--- | :--- | :--- |
| **AI Farming Assistant** | Agronomy AI | Local LLM inference via LM Studio (`phi-3-mini-4k-instruct`) with agricultural system prompts. | `ChatAssistant.jsx` | `POST /chat`<br/>`GET /chat/history` |
| **Scientific Crop Advisory** | Soil Chemistry | Random Forest classifier evaluating soil N-P-K, pH, temperature, humidity, and rainfall. | `CropRecommendation.jsx` | `POST /crop-recommendation` |
| **Leaf Disease Diagnosis** | Computer Vision | MobileNetV2 deep CNN classifying 15 specific plant pathologies across tomato, potato, and pepper. | `LeafHealth.jsx` | `POST /leaf-disease` |
| **Weather Intelligence** | Meteorology | Open-Meteo live API integration with automated reverse-geocoding and fallback metrics. | `WeatherCard.jsx` | `GET /weather` |
| **Voice Assistant** | Accessibility | Native Web Speech API speech-to-text dictation supporting English, Kannada, and Hindi. | `VoiceInput.jsx` | Client-side API |
| **Multi-Language Support** | Localization | Full runtime UI localization across English (`en`), Kannada (`kn`), and Hindi (`hi`). | `LanguageSelector.jsx` | Client-side & `user_preferences` |
| **Live APMC Mandi Prices** | Market Hub (Tab 1) | Search, state/commodity filters, and price sorting across 1,471 mandis in ₹/Quintal. | `MandiPriceIntelligence.jsx` | `GET /mandi/prices`<br/>`GET /mandi/filters` |
| **Price Comparison** | Market Hub (Tab 2) | Multi-mandi spread analysis comparing modal, minimum, and maximum rates for any crop. | `MarketPriceComparison.jsx` | `GET /mandi/compare` |
| **Best Market Suggestion** | Market Hub (Tab 3) | Net profit optimization subtracting estimated transport and transit costs. | `BestMarketSuggestion.jsx` | `GET /mandi/best-market` |
| **Strategic Selling Advice** | Market Hub (Tab 4) | Actionable advice based on price volatility and arrival trends (Sell Now vs Hold). | `BasicSellingAdvice.jsx` | `GET /mandi/selling-advice` |
| **Price Trends & SMAs** | Market Hub (Tab 5) | Historical price evolution with 7-day and 14-day simple moving averages (SMAs). | `MandiPriceTrends.jsx` | `GET /mandi/trends/series`<br/>`GET /mandi/trends/summary` |
| **Forecast Readiness Gate** | Market Hub (Tab 6) | Strict readiness gate blocking ML model training until historical depth is satisfied. | `MarketIntelligenceHub.jsx` | `GET /mandi/forecast/readiness`<br/>`GET /mandi/history/status` |
| **Authentication & Profile** | Security | Local SQLite storage using Argon2 password hashing and JWT bearer tokens. | `LoginPage.jsx`<br/>`RegisterPage.jsx` | `POST /auth/register`<br/>`POST /auth/login` |

---

## 💻 3. Technology Stack

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) `v0.110+` (Python 3.10+ async web framework)
- **ASGI Server**: [Uvicorn](https://www.uvicorn.org/) `v0.28+`
- **Database Engine**: [SQLite3](https://www.sqlite.org/) with WAL mode (`backend/data/agriai.db`)
- **Password Security**: Argon2id via `argon2-cffi` `v23.1.0`
- **Computer Vision**: [TensorFlow](https://tensorflow.org/) `v2.16+` / MobileNetV2
- **Machine Learning**: [Scikit-Learn](https://scikit-learn.org/) `v1.4+` & [Joblib](https://joblib.readthedocs.io/)
- **Data Analysis**: [Pandas](https://pandas.pydata.org/) `v2.2+` & [NumPy](https://numpy.org/) `v1.26+`
- **Image Processing**: [Pillow](https://pillow.readthedocs.io/) `v10.2+`
- **LLM Inference**: [LM Studio](https://lmstudio.ai/) running `phi-3-mini-4k-instruct` (`http://127.0.0.1:1234`)

### Frontend
- **Framework**: [React](https://react.dev/) `v19` & `react-dom`
- **Build Tool**: [Vite](https://vitejs.dev/) `v6`
- **Icons**: [Lucide React](https://lucide.dev/)
- **Design System**: Enterprise SaaS responsive layout with CSS Grid, Flexbox, and glassmorphic tokens
- **Internationalization**: Custom React Context Provider (`en`, `hi`, `kn`)

---

## 📁 4. Project Folder Structure

```
AgriAI/
├── backend/
│   ├── data/
│   │   ├── agriai.db                      # Local SQLite database (Users, Chats, Mandi records)
│   │   └── .gitkeep
│   ├── app.py                             # Main FastAPI backend application
│   ├── db.py                              # Database schema, migrations & Argon2 hashing
│   ├── mandi_service.py                   # Verified Agmarknet baseline seeder & sync pipeline
│   ├── mandi_history.py                   # Longitudinal market time-series collection
│   ├── mandi_quality.py                   # Data normalization & outlier safeguard rules
│   ├── mandi_trends.py                    # Directional analysis & SMA calculations
│   ├── mandi_scheduler.py                 # Daily collection background scheduler
│   ├── mandi_forecasting.py               # Forecasting readiness gate & taxonomy evaluation
│   ├── crop_recommendation_model.pkl      # Pre-trained Scikit-Learn crop classifier
│   ├── leaf_disease_model.keras           # MobileNetV2 vision architecture
│   ├── leaf_disease.weights.h5            # 15-class plant pathology weights
│   ├── requirements.txt                   # Backend Python dependencies
│   ├── .env                               # Local backend environment variables (git-ignored)
│   ├── .env.example                       # Sanitized backend environment template
│   └── test_*.py                          # 46 backend unit tests
│
├── frontend/
│   ├── public/
│   │   └── images/                        # Logos, icons, and agricultural emblems
│   ├── src/
│   │   ├── components/                    # Core UI components and workspaces
│   │   │   ├── DashboardSidebar.jsx       # 260px collapsible SaaS sidebar
│   │   │   ├── DashboardTopNav.jsx        # Sticky top navigation with breadcrumbs
│   │   │   ├── DashboardOverview.jsx      # KPI cards & quick access launchers
│   │   │   ├── MarketIntelligenceHub.jsx  # 6-tab unified mandi market discovery hub
│   │   │   ├── MandiPriceIntelligence.jsx # Live APMC price explorer
│   │   │   ├── MarketPriceComparison.jsx  # Multi-market price spread comparison
│   │   │   ├── BestMarketSuggestion.jsx   # Transport-adjusted net profit finder
│   │   │   ├── BasicSellingAdvice.jsx     # Actionable market selling guidance
│   │   │   ├── MandiPriceTrends.jsx       # Time-series SVG price chart & SMAs
│   │   │   ├── ChatAssistant.jsx          # AI conversational assistant
│   │   │   ├── CropRecommendation.jsx     # Soil N-P-K recommendation module
│   │   │   ├── LeafHealth.jsx             # Deep learning leaf disease diagnostics
│   │   │   └── WeatherCard.jsx            # Live meteorological card
│   │   ├── i18n/                          # Localization dictionaries (en.js, hi.js, kn.js)
│   │   ├── pages/                         # Dashboard, Landing, Login, Register
│   │   ├── services/                      # API client layer (api.js)
│   │   └── styles/                        # Global styling rules (global.css)
│   ├── package.json                       # Node dependencies and scripts
│   ├── vite.config.js                     # Vite build configuration
│   └── .env.example                       # Sanitized frontend environment template
│
├── run_agriai.bat                         # Windows batch launcher
├── start.ps1                              # PowerShell startup script
├── .gitignore                             # Git exclusion rules
└── README.md                              # Main documentation file
```

---

## 🛠 5. Prerequisites

Before installing AgriAI, verify that your environment has:
1. **Python 3.10+**: Confirm with `python --version`.
2. **Node.js 18+ & npm**: Confirm with `node --version` and `npm --version`.
3. **LM Studio** (For AI Chatbot):
   - Download and install [LM Studio](https://lmstudio.ai/).
   - Download model `phi-3-mini-4k-instruct`.
   - Start the local server on `http://127.0.0.1:1234`.

---

## 🔐 6. Environment Variables

### Backend Configuration (`backend/.env`)

Copy `backend/.env.example` to `backend/.env`:

```env
# Official Government Agmarknet Data API Key (Required for live daily syncing)
DATA_GOV_IN_API_KEY=your_api_key_here

# Daily Mandi Price Collection Scheduler
MANDI_SCHEDULER_ENABLED=true
MANDI_SYNC_SCHEDULE_TIME=18:30
MANDI_SYNC_TIMEZONE=Asia/Kolkata

# Local AI Chatbot (LM Studio)
LM_STUDIO_URL=http://127.0.0.1:1234/v1/chat/completions
LM_STUDIO_MODEL=phi-3-mini-4k-instruct
LM_STUDIO_TIMEOUT=15

# Access Control (comma-separated usernames with admin privileges)
ADMIN_USERS=admin,yashas

# Production CORS Allowed Origins (optional)
# ALLOWED_ORIGINS=https://agriai.example.com
```

### Frontend Configuration (`frontend/.env`)

Copy `frontend/.env.example` to `frontend/.env`:

```env
# Backend API Base URL
VITE_API_BASE_URL=http://127.0.0.1:8000
```

---

## 📦 7. Local Installation Steps

### 1. Clone Repository & Setup Virtual Environment
```powershell
cd D:\AgriAI\backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 2. Setup Frontend Dependencies
```powershell
cd D:\AgriAI\frontend
npm install
```

---

## 🚀 8. Backend Startup Instructions

From the project root:
```powershell
cd backend
.\venv\Scripts\python.exe -m uvicorn app:app --reload --host 127.0.0.1 --port 8000
```

The FastAPI backend will:
1. Initialize SQLite database schemas in `backend/data/agriai.db`.
2. Seed the 2,595 verified Agmarknet baseline mandi price records.
3. Load the Scikit-Learn crop recommendation and TensorFlow vision models.
4. Expose the API documentation at `http://127.0.0.1:8000/docs`.

---

## 🖥 9. Frontend Startup Instructions

From the project root:
```powershell
cd frontend
npm run dev
```

The frontend application will start on `http://localhost:5173`.

### One-Click Startup Script (Windows)
Double-click `run_agriai.bat` or run:
```powershell
.\start.ps1
```

---

## 🧪 10. Testing Instructions

### Run Backend Unit Test Suite (46 Tests)
```powershell
cd D:\AgriAI
backend\venv\Scripts\python.exe -m unittest discover -s backend -p "test_*.py"
```

Expected result:
```
Ran 46 tests in ~6s
OK
```

### Run Frontend Production Build Check
```powershell
cd D:\AgriAI
npm --prefix frontend run build
```

Expected result:
```
✓ built in ~7s
dist/index.html
dist/assets/index-*.css
dist/assets/index-*.js
```

---

## 🗄 11. Database Information & Schema

The persistent storage is handled locally via SQLite (`backend/data/agriai.db`).

### Primary Tables
- `users`: Stores user identity, Argon2id password hashes, and registration timestamps.
- `user_preferences`: Farmer interface language settings (`en`, `hi`, `kn`).
- `auth_tokens`: Bearer session tokens with creation timestamps.
- `chat_sessions` & `chat_history`: Multi-turn conversational history.
- `mandi_prices`: Wholesale price records (`state`, `district`, `market`, `commodity`, `variety`, `min_price`, `modal_price`, `max_price`, `arrival_date`, `source_type`).
- `mandi_sync_log`: Audit logs for background and manual data synchronization runs.

---

## 🌐 12. External Service Requirements & Offline Truthfulness

AgriAI distinguishes clearly between **100% Offline Local Capabilities** and **Internet-Dependent Features**:

| Feature | Operational Mode | External Dependency | Behavior When Offline |
| :--- | :---: | :--- | :--- |
| **AI Farming Chatbot** | **Offline** | None (Uses local LM Studio) | Fully functional via local CPU/GPU inference. |
| **Crop Recommendation** | **Offline** | None (Local Scikit-Learn model) | Fully functional without internet. |
| **Leaf Disease Diagnosis** | **Offline** | None (Local MobileNetV2 CNN) | Fully functional without internet. |
| **User Authentication** | **Offline** | None (Local SQLite DB) | Fully functional with local credentials. |
| **Mandi Price Discovery** | **Offline** | None (Uses seeded Agmarknet DB) | Fully functional browsing 2,595 cached records. |
| **Daily Mandi Sync** | **Online** | Official `data.gov.in` API | Suspends sync; serves cached baseline data. |
| **Live Weather Card** | **Online** | Open-Meteo & BigDataCloud APIs | Displays cached readings or district defaults. |

---

## 🚢 13. Deployment Preparation Notes

For production cloud or on-premise deployment:
1. **Reverse Proxy & HTTPS**: Deploy behind Nginx or Caddy with SSL/TLS termination.
2. **Production ASGI Server**: Run Uvicorn via Gunicorn with multiple worker processes:
   ```bash
   gunicorn app:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
   ```
3. **CORS Restrictions**: Set `ALLOWED_ORIGINS` in `backend/.env` to the production domain.
4. **Frontend Static Hosting**: Deploy `frontend/dist` using Nginx, Cloudflare Pages, or AWS S3/CloudFront.
5. **Database Backups**: Schedule automated snapshot backups of `backend/data/agriai.db`.

---

## 🛡 14. Forecasting Readiness Gate & Data Integrity Policy

AgriAI enforces strict scientific integrity:
- **No Premature ML Model Training**: Machine learning time-series models require multi-month, high-frequency historical data. Because the current Agmarknet database contains 2 unique arrival dates (`18/11/2026` and `19/11/2026`), ML forecasting model training is **strictly locked**.
- **No Synthetic or Fake Market Data**: The system never generates fake price curves, simulated predictions, or arbitrary trends.
- **Automated Readiness Gate**: The backend evaluation endpoint (`GET /mandi/forecast/readiness`) automatically determines when sufficient historical observations accumulate before unlocking predictive forecasting features.
