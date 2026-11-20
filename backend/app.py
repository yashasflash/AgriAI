import os
from pathlib import Path
from dotenv import load_dotenv

# Explicitly load backend/.env using absolute path before reading environment variables
ENV_PATH = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=ENV_PATH)

from fastapi import FastAPI, HTTPException, UploadFile, File, Header, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from contextlib import asynccontextmanager
import requests
import joblib
import pandas as pd
import tensorflow as tf
import numpy as np
from PIL import Image
import io

from tensorflow.keras import layers, models
from tensorflow.keras.applications import MobileNetV2

# Import local SQLite database engine, Mandi price intelligence service, and Daily Scheduler
import db
import mandi_service
import mandi_history
import mandi_trends
import mandi_forecasting
from mandi_scheduler import get_mandi_scheduler, acquire_collection_lock, release_collection_lock, is_collection_active


# ============================================================
# AgriAI FastAPI Application — Local Architecture
# ============================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI Lifespan Context Manager:
    - On Startup: Initializes the background daily mandi collection scheduler.
    - On Shutdown: Gracefully halts background scheduler threads.
    """
    scheduler = get_mandi_scheduler()
    scheduler.start()
    yield
    scheduler.stop()

app = FastAPI(
    title="AgriAI",
    description="Offline AI Farming Intelligence Platform — Local Development",
    version="1.0.0",
    lifespan=lifespan
)

# ------------------------------------------------------------
# CORS — allow local frontend development origins (Vite 5173 / 3000)
# ------------------------------------------------------------
local_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "https://yashasflash.github.io"
]

extra_origins_env = os.getenv("ALLOWED_ORIGINS", "").strip()
if extra_origins_env and extra_origins_env != "*":
    for o in extra_origins_env.split(","):
        if o.strip() and o.strip() not in local_origins:
            local_origins.append(o.strip())

app.add_middleware(
    CORSMiddleware,
    allow_origins=local_origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$|^https://.*\.github\.io$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize local SQLite database and seed verified Agmarknet mandi market data
db.init_db()
mandi_service.ensure_mandi_data_seeded()


# ============================================================
# 1. LOCAL AI CHATBOT ENGINE (LM STUDIO)
# ============================================================

LM_STUDIO_URL = os.getenv("LM_STUDIO_URL", "http://127.0.0.1:1234/v1/chat/completions")
LM_STUDIO_MODEL = os.getenv("LM_STUDIO_MODEL", "phi-3-mini-4k-instruct")

print(f"AgriAI Chat Engine: Local LM Studio at {LM_STUDIO_URL} (Model: {LM_STUDIO_MODEL})")


# ============================================================
# 2. LOAD CROP RECOMMENDATION MODEL
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
crop_model_path = os.path.join(BASE_DIR, "crop_recommendation_model.pkl")

try:
    crop_model = joblib.load(crop_model_path)
    print("Crop recommendation model loaded successfully")
except Exception as e:
    print(f"Warning: Failed to load crop recommendation model: {e}")
    crop_model = None


# ============================================================
# 3. LOAD LEAF DISEASE MODEL
# ============================================================

leaf_weights_path = os.path.join(BASE_DIR, "leaf_disease.weights.h5")
leaf_model_path = os.path.join(BASE_DIR, "leaf_disease_model.keras")

try:
    leaf_base_model = MobileNetV2(
        input_shape=(224, 224, 3),
        include_top=False,
        weights=None  # Weights loaded locally from trained weight file
    )
    leaf_base_model.trainable = False

    leaf_model = models.Sequential([
        layers.Input(shape=(224, 224, 3)),
        layers.Rescaling(1.0 / 255),
        leaf_base_model,
        layers.GlobalAveragePooling2D(),
        layers.Dropout(0.2),
        layers.Dense(15, activation="softmax")
    ])

    if os.path.exists(leaf_weights_path):
        leaf_model.load_weights(leaf_weights_path)
        print("Leaf disease model loaded successfully from leaf_disease.weights.h5")
    elif os.path.exists(leaf_model_path):
        leaf_model.load_weights(leaf_model_path)
        print("Leaf disease model loaded successfully from keras weights")
    else:
        print("Warning: Neither leaf_disease.weights.h5 nor leaf_disease_model.keras was found.")
        leaf_model = None
except Exception as e:
    print(f"Warning: Failed to initialize leaf disease model: {e}")
    leaf_model = None


# ============================================================
# 4. LEAF DISEASE CLASS NAMES
# ============================================================

leaf_class_names = [
    "Pepper__bell___Bacterial_spot",
    "Pepper__bell___healthy",
    "Potato___Early_blight",
    "Potato___Late_blight",
    "Potato___healthy",
    "Tomato_Bacterial_spot",
    "Tomato_Early_blight",
    "Tomato_Late_blight",
    "Tomato_Leaf_Mold",
    "Tomato_Septoria_leaf_spot",
    "Tomato_Spider_mites_Two_spotted_spider_mite",
    "Tomato__Target_Spot",
    "Tomato__Tomato_YellowLeaf__Curl_Virus",
    "Tomato__Tomato_mosaic_virus",
    "Tomato_healthy"
]


# ============================================================
# 5. REQUEST & RESPONSE MODELS
# ============================================================

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    language: Optional[str] = "en"


class CropRequest(BaseModel):
    N: float
    P: float
    K: float
    temperature: float
    humidity: float
    ph: float
    rainfall: float


class RegisterRequest(BaseModel):
    name: str
    password: str
    language: Optional[str] = "en"


class LoginRequest(BaseModel):
    name: str
    password: str


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    language: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None


class NewChatRequest(BaseModel):
    title: Optional[str] = "New Farming Chat"


# Helper dependencies for authentication
def get_current_user_optional(authorization: Optional[str] = Header(None)):
    if not authorization:
        return None
    token = authorization.replace("Bearer ", "").strip()
    return db.get_user_by_token(token)

def get_current_user_required(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Authentication token is required")
    token = authorization.replace("Bearer ", "").strip()
    user = db.get_user_by_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired session token")
    return user

def get_current_admin_user(user: dict = Depends(get_current_user_required)):
    admin_users = [u.strip().lower() for u in os.getenv("ADMIN_USERS", "admin,yashas").split(",") if u.strip()]
    username = str(user.get("name") or "").strip().lower()
    if username not in admin_users:
        raise HTTPException(
            status_code=403,
            detail="Administrator access required to perform this action."
        )
    return user


# ============================================================
# 6. HOME & HEALTH ENDPOINTS
# ============================================================

@app.get("/")
def home():
    return {
        "project": "AgriAI",
        "purpose": "Local AI Farming Intelligence Platform",
        "status": "Backend is running locally",
        "database": f"SQLite Local Storage ({db.DB_PATH})",
        "llm_provider": "LM Studio (http://127.0.0.1:1234)",
        "llm_model": LM_STUDIO_MODEL
    }


@app.get("/health")
def health():
    db_status = "connected"
    try:
        conn = db.get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT 1")
            cursor.fetchone()
        finally:
            conn.close()
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    overall_status = "healthy" if db_status == "connected" else "degraded"

    return {
        "status": overall_status,
        "database": db_status,
        "llm_provider": "lmstudio",
        "llm_url": LM_STUDIO_URL,
        "llm_model": LM_STUDIO_MODEL,
        "crop_model": "loaded" if crop_model is not None else "unavailable",
        "leaf_model": "loaded" if leaf_model is not None else "unavailable"
    }


# ============================================================
# 7. LOCAL AUTHENTICATION ENDPOINTS
# ============================================================

@app.post("/auth/register")
def register(req: RegisterRequest):
    try:
        user_info, token = db.register_user(req.name, req.password, req.language)
        return {
            "status": "success",
            "message": "User registered successfully",
            "token": token,
            "user": user_info
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration error: {e}")


@app.post("/auth/login")
def login(req: LoginRequest):
    try:
        user_info, token = db.login_user(req.name, req.password)
        return {
            "status": "success",
            "message": "Login successful",
            "token": token,
            "user": user_info
        }
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Login error: {e}")


@app.get("/auth/profile")
def get_profile(user: dict = Depends(get_current_user_required)):
    return {
        "status": "success",
        "user": user
    }


@app.put("/auth/profile")
def update_profile(req: UpdateProfileRequest, user: dict = Depends(get_current_user_required)):
    try:
        updated_user = db.update_user_profile(
            user_id=user["id"],
            name=req.name,
            language=req.language,
            new_password=req.new_password,
            current_password=req.current_password
        )
        return {
            "status": "success",
            "message": "Profile updated successfully",
            "user": updated_user
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Profile update error: {e}")


@app.post("/auth/logout")
def logout(authorization: Optional[str] = Header(None)):
    if authorization:
        token = authorization.replace("Bearer ", "").strip()
        db.logout_token(token)
    return {"status": "success", "message": "Logged out successfully"}


# ============================================================
# 8. PERSISTENT CHAT HISTORY & SESSIONS ENDPOINTS
# ============================================================

@app.get("/chat/history")
def get_chat_history_sessions(q: Optional[str] = Query(None), user: dict = Depends(get_current_user_required)):
    sessions = db.get_user_chat_sessions(user_id=user["id"], search_query=q)
    return {
        "status": "success",
        "sessions": sessions
    }


@app.get("/chat/history/{session_id}")
def get_chat_session_detail(session_id: str, user: dict = Depends(get_current_user_required)):
    session_data = db.get_session_messages(session_id=session_id, user_id=user["id"])
    if not session_data:
        raise HTTPException(status_code=404, detail="Chat conversation not found")
    return {
        "status": "success",
        "session": session_data
    }


@app.post("/chat/new")
def create_new_chat(req: NewChatRequest, user: dict = Depends(get_current_user_required)):
    session_id = db.create_chat_session(user_id=user["id"], title=req.title or "New Farming Chat")
    return {
        "status": "success",
        "session_id": session_id,
        "title": req.title or "New Farming Chat"
    }


@app.delete("/chat/history/{session_id}")
def delete_chat_session_endpoint(session_id: str, user: dict = Depends(get_current_user_required)):
    success = db.delete_chat_session(session_id=session_id, user_id=user["id"])
    if not success:
        raise HTTPException(status_code=404, detail="Conversation not found or could not be deleted")
    return {
        "status": "success",
        "message": "Conversation deleted successfully"
    }


@app.delete("/chat/history")
def clear_all_history_endpoint(user: dict = Depends(get_current_user_required)):
    db.clear_all_chat_history(user_id=user["id"])
    return {
        "status": "success",
        "message": "All chat history cleared successfully"
    }


# ============================================================
# 9. AI FARMING CHATBOT (LM STUDIO LOCAL INFERENCE)
# ============================================================

@app.post("/chat")
def chat(request: ChatRequest, current_user: Optional[dict] = Depends(get_current_user_optional)):
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    # Language customization in system prompt
    lang_instruction = ""
    if request.language == "kn":
        lang_instruction = "Respond in simple Kannada (ಕನ್ನಡ) or English with Kannada explanations."
    elif request.language == "hi":
        lang_instruction = "Respond in simple Hindi (हिंदी) or English with Hindi explanations."

    payload = {
        "model": LM_STUDIO_MODEL,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are AgriAI, a helpful farming assistant for farmers. "
                    "Answer the farmer's question directly. "
                    "Give practical, concise, and useful farming advice. "
                    "Use short paragraphs or bullet points. "
                    f"{lang_instruction} "
                    "Do not discuss your internal reasoning."
                )
            },
            {
                "role": "user",
                "content": request.message
            }
        ],
        "temperature": 0.7,
        "top_p": 0.8,
        "max_tokens": 500,
        "stream": False
    }

    headers = {
        "Content-Type": "application/json"
    }

    try:
        timeout_val = int(os.getenv("LM_STUDIO_TIMEOUT", "15"))
        response = requests.post(LM_STUDIO_URL, json=payload, headers=headers, timeout=timeout_val)
        response.raise_for_status()
        result = response.json()
        answer = result["choices"][0]["message"]["content"]

        session_id = request.session_id

        # If user is logged in, automatically save message to local SQLite chat history
        if current_user:
            user_id = current_user["id"]
            if not session_id:
                session_id = db.create_chat_session(user_id, title="New Farming Chat")
            
            saved_msg = db.save_chat_message(
                user_id=user_id,
                session_id=session_id,
                question=request.message,
                answer=answer,
                language=request.language or "en"
            )
            session_id = saved_msg["session_id"]

        return {
            "question": request.message,
            "answer": answer,
            "session_id": session_id
        }

    except requests.exceptions.ConnectionError:
        raise HTTPException(
            status_code=503,
            detail=f"Cannot connect to LM Studio at {LM_STUDIO_URL}. Please ensure LM Studio is running locally on port 1234 with model '{LM_STUDIO_MODEL}' loaded."
        )
    except requests.exceptions.Timeout:
        raise HTTPException(
            status_code=504,
            detail="LM Studio request timed out. Please check model inference load."
        )
    except requests.exceptions.HTTPError as error:
        status = response.status_code if 'response' in locals() else 500
        raise HTTPException(
            status_code=status,
            detail=f"LM Studio error: {error}"
        )
    except requests.exceptions.RequestException as error:
        raise HTTPException(
            status_code=500,
            detail=f"LM Studio request failed: {error}"
        )
    except (KeyError, IndexError):
        raise HTTPException(
            status_code=500,
            detail="Unexpected response structure received from LM Studio."
        )


# ============================================================
# 10. CROP RECOMMENDATION ML MODEL
# ============================================================

@app.post("/crop-recommendation")
def crop_recommendation(request: CropRequest):
    try:
        farmer_data = pd.DataFrame([{
            "N": request.N,
            "P": request.P,
            "K": request.K,
            "temperature": request.temperature,
            "humidity": request.humidity,
            "ph": request.ph,
            "rainfall": request.rainfall
        }])

        prediction = crop_model.predict(farmer_data)[0]
        probabilities = crop_model.predict_proba(farmer_data)[0]
        confidence = max(probabilities) * 100

        return {
            "recommended_crop": prediction,
            "confidence": round(confidence, 2)
        }
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Crop prediction failed: {error}"
        )


# ============================================================
# 11. LEAF DISEASE DETECTION MODEL
# ============================================================

@app.post("/leaf-disease")
async def leaf_disease(file: UploadFile = File(...)):
    try:
        if not file.content_type:
            raise HTTPException(status_code=400, detail="File type could not be detected.")

        allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail="Please upload a JPG, JPEG, PNG or WEBP image."
            )

        image_data = await file.read()
        if not image_data:
            raise HTTPException(status_code=400, detail="Uploaded image is empty.")

        image = Image.open(io.BytesIO(image_data)).convert("RGB")
        image = image.resize((224, 224))
        image_array = np.array(image, dtype=np.float32)
        image_array = np.expand_dims(image_array, axis=0)

        predictions = leaf_model.predict(image_array, verbose=0)
        predicted_index = int(np.argmax(predictions[0]))
        predicted_class = leaf_class_names[predicted_index]
        confidence = float(predictions[0][predicted_index] * 100)

        return {
            "filename": file.filename,
            "predicted_disease": predicted_class,
            "confidence": round(confidence, 2)
        }
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Leaf prediction failed: {error}"
        )


# ============================================================
# 12. REAL-TIME WEATHER API
# ============================================================

def wmo_code_to_condition(code: int) -> str:
    """Map standard WMO weather codes to human-readable agricultural conditions."""
    mapping = {
        0: "Clear Sky",
        1: "Mainly Clear",
        2: "Partly Cloudy",
        3: "Overcast",
        45: "Foggy",
        48: "Depositing Rime Fog",
        51: "Light Drizzle",
        53: "Moderate Drizzle",
        55: "Dense Drizzle",
        56: "Light Freezing Drizzle",
        57: "Dense Freezing Drizzle",
        61: "Slight Rain",
        63: "Moderate Rain",
        65: "Heavy Rain",
        66: "Light Freezing Rain",
        67: "Heavy Freezing Rain",
        71: "Slight Snowfall",
        73: "Moderate Snowfall",
        75: "Heavy Snowfall",
        77: "Snow Grains",
        80: "Slight Rain Showers",
        81: "Moderate Rain Showers",
        82: "Violent Rain Showers",
        85: "Slight Snow Showers",
        86: "Heavy Snow Showers",
        95: "Thunderstorm",
        96: "Thunderstorm with Slight Hail",
        99: "Thunderstorm with Heavy Hail"
    }
    return mapping.get(code, "Clear Sky")


@app.get("/weather")
def get_weather(
    lat: float = Query(..., description="Latitude of user's current location"),
    lon: float = Query(..., description="Longitude of user's current location")
):
    """
    Fetches real-time weather data directly from Open-Meteo for the specified latitude & longitude,
    and resolves the reverse geocoded city name via BigDataCloud or Open-Meteo geocoding.
    """
    try:
        # Reverse geocode city name
        city, region, country = None, None, None
        try:
            geo_res = requests.get(
                "https://api.bigdatacloud.net/data/reverse-geocode-client",
                params={"latitude": lat, "longitude": lon, "localityLanguage": "en"},
                timeout=5
            )
            if geo_res.status_code == 200:
                geo_data = geo_res.json()
                city = geo_data.get("city") or geo_data.get("locality") or geo_data.get("principalSubdivision")
                region = geo_data.get("principalSubdivision")
                country = geo_data.get("countryName")
        except Exception:
            pass

        # Fetch Open-Meteo live weather
        weather_url = "https://api.open-meteo.com/v1/forecast"
        weather_params = {
            "latitude": lat,
            "longitude": lon,
            "current": "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m",
            "daily": "temperature_2m_max,temperature_2m_min,precipitation_probability_max",
            "timezone": "auto",
            "forecast_days": 1
        }
        
        res = requests.get(weather_url, params=weather_params, timeout=8)
        if res.status_code != 200:
            raise HTTPException(status_code=502, detail="Failed to retrieve weather data from Open-Meteo.")

        data = res.json()
        current = data.get("current", {})
        daily = data.get("daily", {})
        
        wmo_code = current.get("weather_code", 0)
        condition_text = wmo_code_to_condition(wmo_code)
        
        max_temps = daily.get("temperature_2m_max", [])
        min_temps = daily.get("temperature_2m_min", [])
        rain_probs = daily.get("precipitation_probability_max", [])
        
        min_temp = min_temps[0] if min_temps else None
        max_temp = max_temps[0] if max_temps else None
        rain_prob = rain_probs[0] if rain_probs else 0
        
        return {
            "location": {
                "city": city or "Local Area",
                "region": region,
                "country": country,
                "latitude": round(lat, 4),
                "longitude": round(lon, 4)
            },
            "weather": {
                "temperature": round(current.get("temperature_2m", 0)),
                "feelsLike": round(current.get("apparent_temperature", current.get("temperature_2m", 0))),
                "humidity": round(current.get("relative_humidity_2m", 0)),
                "windSpeed": round(current.get("wind_speed_10m", 0)),
                "condition": condition_text,
                "weatherCode": wmo_code,
                "precipitation": current.get("precipitation", 0.0),
                "rainProbability": rain_prob,
                "minTemperature": round(min_temp) if min_temp is not None else None,
                "maxTemperature": round(max_temp) if max_temp is not None else None
            },
            "updatedAt": current.get("time") or pd.Timestamp.now(tz="UTC").isoformat()
        }
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch live weather: {error}"
        )


# ============================================================
# 13. LIVE MANDI PRICE INTELLIGENCE ENDPOINTS
# ============================================================

class MandiSyncRequest(BaseModel):
    api_key: Optional[str] = None


class MandiHistoryCollectRequest(BaseModel):
    api_key: Optional[str] = None
    commodity: Optional[str] = None
    state: Optional[str] = "Karnataka"
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    max_pages: Optional[int] = 5
    page_size: Optional[int] = 100


@app.get("/mandi/prices")
def get_mandi_prices_endpoint(
    search: Optional[str] = Query(None, description="Search commodity or market name"),
    state: Optional[str] = Query(None, description="Filter by Indian State"),
    district: Optional[str] = Query(None, description="Filter by District"),
    market: Optional[str] = Query(None, description="Filter by Mandi Market"),
    commodity: Optional[str] = Query(None, description="Filter by Agricultural Commodity"),
    sort: Optional[str] = Query("date_desc", description="Sort order: date_desc, price_desc, price_asc, commodity_asc"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page")
):
    """
    Search and filter live/cached agricultural mandi prices across Indian APMC markets.
    Supports filtering by crop, state, district, and market with min, max, and modal rates.
    """
    try:
        clean_search = search if isinstance(search, str) else None
        clean_state = state if isinstance(state, str) else None
        clean_district = district if isinstance(district, str) else None
        clean_market = market if isinstance(market, str) else None
        clean_commodity = commodity if isinstance(commodity, str) else None
        clean_sort = sort if isinstance(sort, str) else "date_desc"
        clean_page = page if isinstance(page, int) else 1
        clean_limit = limit if isinstance(limit, int) else 20

        data = db.get_mandi_prices(
            search=clean_search,
            state=clean_state,
            district=clean_district,
            market=clean_market,
            commodity=clean_commodity,
            sort=clean_sort,
            page=clean_page,
            limit=clean_limit
        )
        return {
            "status": "success",
            **data
        }
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve mandi prices: {error}"
        )


@app.get("/mandi/filters")
def get_mandi_filters_endpoint(
    state: Optional[str] = Query(None, description="Optional state to filter child districts and markets")
):
    """
    Returns available filter options: distinct states, districts, markets, and commodities.
    """
    try:
        filters = db.get_mandi_filter_options(state=state)
        return {
            "status": "success",
            "filters": filters
        }
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve mandi filter options: {error}"
        )


@app.get("/mandi/summary")
def get_mandi_summary_endpoint():
    """
    Provides top-level agricultural market intelligence:
    total markets covered, top benchmark commodities, average modal prices, and last sync timestamp.
    """
    try:
        summary = db.get_mandi_market_summary()
        return {
            "status": "success",
            "summary": summary
        }
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate mandi market summary: {error}"
        )


@app.post("/mandi/sync")
def sync_mandi_prices_endpoint(req: Optional[MandiSyncRequest] = None):
    """
    Synchronizes mandi market data from data.gov.in official Agmarknet API (if configured)
    or refreshes the verified local Agmarknet database cache.
    """
    try:
        key = req.api_key if req else None
        result = mandi_service.sync_mandi_prices_pipeline(api_key=key)
        return {
            "status": "success",
            "sync": result
        }
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Mandi price synchronization failed: {error}"
        )


@app.post("/mandi/history/collect")
def collect_mandi_history_endpoint(req: Optional[MandiHistoryCollectRequest] = None):
    """
    Feature 5 - Stage 2: Historical Mandi Price Data Collection.
    Collects genuine daily market wholesale prices from official data.gov.in Agmarknet API.
    Supports priority crops (Tomato, Onion, Rice, Wheat, Cotton) and Karnataka APMC mandis.
    """
    try:
        api_key = req.api_key if req else None
        crops = [req.commodity] if (req and req.commodity) else None
        state = (req.state if req and req.state else "Karnataka")
        start_date = req.start_date if req else None
        end_date = req.end_date if req else None
        max_pages = req.max_pages if req and req.max_pages else 5
        page_size = req.page_size if req and req.page_size else 100

        result = mandi_service.collect_historical_mandi_prices(
            api_key=api_key,
            crops=crops,
            state=state,
            start_date=start_date,
            end_date=end_date,
            max_pages_per_crop=max_pages,
            page_size=page_size
        )
        return {
            "status": "success" if result.get("status") in ("success", "partial") else "failed",
            "collection": result
        }
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Historical mandi price collection failed: {error}"
        )


@app.get("/mandi/history/status")
def get_mandi_history_status_endpoint():
    """
    Feature 5 - Stage 5: Historical Mandi Price Accumulation & Monitoring Status.
    Returns comprehensive nationwide telemetry: total records, baseline vs live counts,
    unique time-series, arrival dates, history depth distribution across readiness tiers,
    readiness classification warning, and detailed breakdown.
    """
    try:
        stage2_status = db.get_historical_collection_status()
        stage5_status = mandi_history.get_overall_history_status()
        # Merge both dictionaries for complete backwards-compatibility and rich monitoring
        combined = {**stage2_status, **stage5_status}
        return {
            "status": "success",
            "history_status": combined
        }
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve historical mandi status: {error}"
        )


@app.get("/mandi/history/commodities")
def get_mandi_history_commodities_endpoint():
    """
    Feature 5 - Stage 5: Commodity Historical Coverage.
    Returns historical observation counts, distinct arrival dates, price ranges,
    valid vs suspicious counts, and depth classifications grouped by commodity and variety.
    """
    try:
        commodities_data = mandi_history.get_commodity_history_summary()
        return {
            "status": "success",
            "count": len(commodities_data),
            "commodities": commodities_data
        }
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve commodity historical coverage: {error}"
        )


@app.get("/mandi/history/markets")
def get_mandi_history_markets_endpoint(
    state: Optional[str] = Query(None, description="Optional state filter"),
    commodity: Optional[str] = Query(None, description="Optional commodity filter"),
    search: Optional[str] = Query(None, description="Search term for market name or district"),
    page: Optional[int] = Query(1, description="Page number (1-based)"),
    limit: Optional[int] = Query(50, description="Number of markets per page (max 200)")
):
    """
    Feature 5 - Stage 5: Market-Level Historical Coverage.
    Returns historical series summary at the APMC market level: total observations,
    distinct crops, arrival dates horizon, staleness indicators, and depth classifications.
    """
    try:
        clean_state = state if isinstance(state, str) else None
        clean_commodity = commodity if isinstance(commodity, str) else None
        clean_search = search if isinstance(search, str) else None
        clean_page = page if isinstance(page, int) else 1
        clean_limit = limit if isinstance(limit, int) else 50

        markets_data = mandi_history.get_market_history_summary(
            state=clean_state,
            commodity=clean_commodity,
            search=clean_search,
            page=clean_page,
            limit=clean_limit
        )
        return {
            "status": "success",
            **markets_data
        }
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve market historical coverage: {error}"
        )


@app.get("/mandi/history/series")
def get_mandi_history_series_endpoint(
    commodity: str = Query(..., description="Agricultural commodity name (e.g. Tomato, Onion, Wheat)"),
    market: Optional[str] = Query(None, description="Optional APMC market name"),
    variety: Optional[str] = Query(None, description="Optional crop variety"),
    state: Optional[str] = Query(None, description="Optional state filter"),
    unit: Optional[str] = Query(None, description="Optional price unit (default: Rs/Quintal)"),
    start_date: Optional[str] = Query(None, description="Optional start arrival date (DD/MM/YYYY or YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Optional end arrival date (DD/MM/YYYY or YYYY-MM-DD)"),
    page: Optional[int] = Query(1, description="Page number (1-based)"),
    limit: Optional[int] = Query(50, description="Number of observations per page (max 200)")
):
    """
    Feature 5 - Stage 5: Historical Time-Series Retrieval.
    Returns chronological historical price points for a selected series with calendar day gaps,
    quality evaluation flags, date filtering, summary metrics, and depth classification.
    """
    try:
        clean_commodity = commodity if isinstance(commodity, str) else ""
        clean_market = market if isinstance(market, str) else None
        clean_variety = variety if isinstance(variety, str) else None
        clean_state = state if isinstance(state, str) else None
        clean_unit = unit if isinstance(unit, str) else None
        clean_start = start_date if isinstance(start_date, str) else None
        clean_end = end_date if isinstance(end_date, str) else None
        clean_page = page if isinstance(page, int) else 1
        clean_limit = limit if isinstance(limit, int) else 50

        series_data = mandi_history.get_series_history(
            commodity=clean_commodity,
            market=clean_market,
            variety=clean_variety,
            state=clean_state,
            unit=clean_unit,
            start_date=clean_start,
            end_date=clean_end,
            page=clean_page,
            limit=clean_limit
        )
        return {
            "status": "success",
            **series_data
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve historical price series: {error}"
        )


@app.get("/mandi/history/quality")
def get_mandi_history_quality_endpoint():
    """
    Feature 5 - Stage 5: Historical Data Quality Audit.
    Audits nationwide historical records: lists suspicious price observations with economic explanations,
    detects date continuity anomalies and gaps, and surfaces stale market feeds.
    """
    try:
        quality_data = mandi_history.get_history_quality_audit()
        return {
            "status": "success",
            **quality_data
        }
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to perform historical data quality audit: {error}"
        )


@app.get("/mandi/trends/series")
def get_mandi_trends_series_endpoint(
    commodity: str = Query(..., description="Agricultural commodity name (e.g. Tomato, Onion, Wheat)"),
    market: str = Query(..., description="Target APMC market name"),
    variety: Optional[str] = Query(None, description="Optional crop variety"),
    state: Optional[str] = Query(None, description="Optional state filter"),
    unit: Optional[str] = Query(None, description="Optional price unit (default: Rs/Quintal)"),
    observations: Optional[int] = Query(30, description="Maximum trailing observations (default: 30)")
):
    """
    Feature 5 - Stage 6A: Statistical Mandi Price Trend Analysis.
    Evaluates observed historical price direction (Rising, Falling, Stable, Insufficient Data),
    calculates observation-based Simple Moving Averages (7- and 14-observation SMA when horizon allows),
    and outputs transparent confidence scores.
    Strictly descriptive historical statistics; NOT an ML forecasting or financial advice system.
    """
    try:
        clean_commodity = commodity if isinstance(commodity, str) else ""
        clean_market = market if isinstance(market, str) else ""
        clean_variety = variety if isinstance(variety, str) else None
        clean_state = state if isinstance(state, str) else None
        clean_unit = unit if isinstance(unit, str) else None
        clean_obs = observations if isinstance(observations, int) else 30

        if not clean_commodity.strip() or not clean_market.strip():
            raise HTTPException(status_code=400, detail="Commodity and market parameters are required.")

        trend_data = mandi_trends.analyze_series_trend(
            commodity=clean_commodity,
            market=clean_market,
            variety=clean_variety,
            state=clean_state,
            unit=clean_unit,
            observations_limit=clean_obs
        )
        return trend_data
    except HTTPException:
        raise
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to evaluate mandi price trends: {error}"
        )


@app.get("/mandi/trends/summary")
def get_mandi_trends_summary_endpoint(
    commodity: str = Query(..., description="Agricultural commodity name (e.g. Tomato, Onion, Wheat)"),
    state: Optional[str] = Query(None, description="Optional state filter")
):
    """
    Feature 5 - Stage 6A: Multi-Market Mandi Price Trend Summary.
    Summarizes wholesale price directions (Rising, Falling, Stable, Insufficient Data)
    across reporting APMC mandis for a given commodity.
    Includes data quality warnings and explicit non-predictive disclaimers.
    """
    try:
        clean_commodity = commodity if isinstance(commodity, str) else ""
        clean_state = state if isinstance(state, str) else None

        if not clean_commodity.strip():
            raise HTTPException(status_code=400, detail="Commodity parameter is required.")

        summary_data = mandi_trends.get_commodity_trends_summary(
            commodity=clean_commodity,
            state=clean_state
        )
        return summary_data
    except HTTPException:
        raise
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate mandi trends summary: {error}"
        )


class MandiDailyTriggerRequest(BaseModel):
    commodity: Optional[str] = None
    state: Optional[str] = None
    max_pages: Optional[int] = 50
    page_size: Optional[int] = 100


@app.post("/mandi/daily/trigger")
def trigger_mandi_daily_collection_endpoint(
    req: Optional[MandiDailyTriggerRequest] = None,
    admin_user: dict = Depends(get_current_admin_user)
):
    """
    Feature 5 - Stage 4: Manual Daily Mandi Price Collection Endpoint.
    Enforces administrator authentication. Rejects unauthenticated callers and non-admin users.
    Guarantees non-overlapping execution: rejects concurrent attempts if another job is active.
    Exclusively uses the server's securely configured DATA_GOV_IN_API_KEY from backend/.env.
    """
    if not acquire_collection_lock():
        raise HTTPException(
            status_code=409,
            detail="A mandi price collection pipeline is already currently running. Please wait for it to complete."
        )
    try:
        commodity = req.commodity if req else None
        crops = [commodity] if commodity else None
        state = req.state if req else None
        max_pages = req.max_pages if (req and req.max_pages) else 50
        page_size = req.page_size if (req and req.page_size) else 100

        result = mandi_service.run_daily_mandi_collection(
            api_key=None,  # Always use backend/.env configured API key
            crops=crops,
            state=state,
            max_pages_per_crop=max_pages,
            page_size=page_size
        )
        return {
            "status": "success" if result.get("status") in ("success", "partial") else "failed",
            "summary": result
        }
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Daily mandi collection failed: {error}"
        )
    finally:
        release_collection_lock()


@app.get("/mandi/freshness")
@app.get("/mandi/collection/status")
def get_mandi_freshness_endpoint():
    """
    Feature 5 - Stage 4: Data Freshness & Collection Status.
    Provides complete audit of mandi feed recency:
    - Last successful collection and last attempted collection.
    - Latest arrival date available overall and per commodity.
    - Days lag vs India Standard Time (Asia/Kolkata).
    - Staleness evaluation (never reports fresh merely on HTTP 200).
    - Checks for missing commodity feeds.
    - Background scheduler operational status.
    """
    try:
        freshness = db.get_mandi_freshness_status()
        scheduler_info = get_mandi_scheduler().get_status()
        return {
            "status": "success",
            "freshness": freshness,
            "scheduler": scheduler_info
        }
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate data freshness status: {error}"
        )


@app.get("/mandi/compare")
def get_mandi_compare_endpoint(
    commodity: str = Query(..., description="Agricultural commodity name to compare"),
    state: Optional[str] = Query(None, description="Optional state filter"),
    unit: Optional[str] = Query(None, description="Optional unit filter"),
    variety: Optional[str] = Query(None, description="Optional variety filter")
):
    """
    Compares wholesale mandi prices across APMC markets for a selected crop.
    Computes highest modal rate, lowest modal rate, price spread (difference), and average modal price.
    """
    try:
        clean_comm = commodity if isinstance(commodity, str) else ""
        clean_state = state if isinstance(state, str) else None
        clean_unit = unit if isinstance(unit, str) else None
        clean_variety = variety if isinstance(variety, str) else None

        result = db.get_mandi_price_comparison(
            commodity=clean_comm,
            state=clean_state,
            unit=clean_unit,
            variety=clean_variety
        )
        return {
            "status": "success",
            "comparison": result
        }
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate price comparison: {error}"
        )


@app.get("/mandi/best-market")
def get_best_market_endpoint(
    commodity: str = Query(..., description="Agricultural crop name to find best selling market"),
    state: Optional[str] = Query(None, description="Optional state filter"),
    unit: Optional[str] = Query(None, description="Optional unit filter"),
    variety: Optional[str] = Query(None, description="Optional variety filter")
):
    """
    Feature 3: Best Market Suggestion MVP.
    Identifies the single highest paying APMC market for a crop,
    computes advantage metrics vs competitors/lowest, explains the recommendation rationale,
    and returns alternative markets.
    """
    try:
        clean_comm = commodity if isinstance(commodity, str) else ""
        clean_state = state if isinstance(state, str) else None
        clean_unit = unit if isinstance(unit, str) else None
        clean_variety = variety if isinstance(variety, str) else None

        result = db.get_best_market_suggestion(
            commodity=clean_comm,
            state=clean_state,
            unit=clean_unit,
            variety=clean_variety
        )
        return {
            "status": "success",
            "recommendation": result
        }
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to compute best market suggestion: {error}"
        )


@app.get("/mandi/selling-advice")
def get_selling_advice_endpoint(
    commodity: str = Query(..., description="Agricultural crop name for selling advice"),
    state: Optional[str] = Query(None, description="Optional state filter"),
    market: Optional[str] = Query(None, description="Optional selected mandi to evaluate"),
    variety: Optional[str] = Query(None, description="Optional variety filter"),
    unit: Optional[str] = Query(None, description="Optional unit filter")
):
    """
    Feature 4: Basic Selling Advice MVP.
    Evaluates whether the farmer's current or local APMC mandi is competitive or if another
    available market offers a higher price, with practical selling tips and verifiable provenance.
    """
    try:
        clean_comm = commodity if isinstance(commodity, str) else ""
        clean_state = state if isinstance(state, str) else None
        clean_market = market if isinstance(market, str) else None
        clean_variety = variety if isinstance(variety, str) else None
        clean_unit = unit if isinstance(unit, str) else None

        result = db.get_basic_selling_advice(
            commodity=clean_comm,
            state=clean_state,
            unit=clean_unit,
            variety=clean_variety,
            selected_market=clean_market
        )
        return {
            "status": "success",
            "advice": result
        }
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate selling advice: {error}"
        )


# ============================================================
# Feature 5 - Stage 7B: Mandi Forecasting Infrastructure Endpoints
# ============================================================

@app.get("/mandi/forecast/readiness")
def get_mandi_forecast_readiness_endpoint():
    """
    Stage 7B: System-Wide Forecasting Readiness Gate.
    Returns:
    - Total eligible distinct time series across the database.
    - Distribution across the 5 forecasting readiness tiers.
    - Commodity-level readiness audit and explanation.
    - Top candidate benchmark mandis for future evaluation once accumulation matures.
    - Explicit overall readiness verdict (strictly locking ML training).
    """
    try:
        data = mandi_forecasting.get_system_forecasting_readiness()
        return {
            "status": "success",
            "forecast_readiness": data
        }
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to audit forecasting readiness: {error}"
        )


@app.get("/mandi/forecast/series")
def get_mandi_forecast_series_endpoint(
    commodity: str = Query(..., description="Agricultural crop name"),
    market: str = Query(..., description="APMC mandi market name"),
    state: Optional[str] = Query(None, description="Optional state filter"),
    variety: Optional[str] = Query(None, description="Optional variety filter"),
    unit: Optional[str] = Query(None, description="Optional unit filter")
):
    """
    Stage 7B: Forecasting Dataset Preparation for a specific time series:
    (commodity + variety + market + state + unit).
    Returns:
    - Chronologically sorted genuine observations.
    - Valid observation count.
    - Excluded suspicious observation count (Stage 3 safeguards).
    - Readiness classification tier and description.
    - Latest arrival date and provenance summary.
    """
    try:
        clean_comm = commodity if isinstance(commodity, str) else ""
        clean_market = market if isinstance(market, str) else ""
        clean_state = state if isinstance(state, str) else None
        clean_variety = variety if isinstance(variety, str) else None
        clean_unit = unit if isinstance(unit, str) else None

        data = mandi_forecasting.prepare_forecasting_dataset(
            commodity=clean_comm,
            market=clean_market,
            state=clean_state,
            variety=clean_variety,
            unit=clean_unit
        )
        return {
            "status": "success",
            "forecast_series": data
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve forecasting series: {error}"
        )


@app.get("/mandi/forecast/baseline")
def get_mandi_forecast_baseline_endpoint(
    commodity: str = Query(..., description="Agricultural crop name"),
    market: str = Query(..., description="APMC mandi market name"),
    state: Optional[str] = Query(None, description="Optional state filter"),
    variety: Optional[str] = Query(None, description="Optional variety filter"),
    unit: Optional[str] = Query(None, description="Optional unit filter")
):
    """
    Stage 7B: Naive Forecasting Baseline Evaluator (y_hat_t = y_{t-1}).
    Returns:
    - Walk-forward baseline evaluation when sufficient data exists (>= 2 observations).
    - Calculated MAE, RMSE, and MAPE metrics against genuine next prices.
    - Transparent insufficient-data explanation when fewer than 2 observations exist.
    """
    try:
        clean_comm = commodity if isinstance(commodity, str) else ""
        clean_market = market if isinstance(market, str) else ""
        clean_state = state if isinstance(state, str) else None
        clean_variety = variety if isinstance(variety, str) else None
        clean_unit = unit if isinstance(unit, str) else None

        dataset = mandi_forecasting.prepare_forecasting_dataset(
            commodity=clean_comm,
            market=clean_market,
            state=clean_state,
            variety=clean_variety,
            unit=clean_unit
        )
        baseline = mandi_forecasting.evaluate_naive_baseline(
            observations=dataset.get("valid_observations", [])
        )
        return {
            "status": "success",
            "time_series_identity": dataset.get("time_series_identity"),
            "valid_observations_count": dataset.get("valid_observations_count", 0),
            "readiness": dataset.get("readiness"),
            "naive_baseline": baseline
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to evaluate forecasting baseline: {error}"
        )


