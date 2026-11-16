from fastapi import FastAPI, HTTPException, UploadFile, File, Header, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import requests
import joblib
import pandas as pd
import tensorflow as tf
import numpy as np
from PIL import Image
import io
import os

from tensorflow.keras import layers, models
from tensorflow.keras.applications import MobileNetV2

# Import database engine (PostgreSQL/Supabase if DATABASE_URL set, else SQLite)
import db


# ============================================================
# AgriAI FastAPI Application
# ============================================================

app = FastAPI(
    title="AgriAI",
    description="Offline AI Farming Intelligence Platform",
    version="1.0.0"
)

# ------------------------------------------------------------
# CORS — allow frontend origins (GitHub Pages + localhost)
# ------------------------------------------------------------
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "*")
if allowed_origins_env == "*":
    origins = ["*"]
else:
    origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database tables
db.init_db()


# ============================================================
# 1. AI CHATBOT ENGINE (GROQ CLOUD API vs LM STUDIO LOCAL)
# ============================================================

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip()
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "groq" if GROQ_API_KEY else "lmstudio").lower()

# Groq Cloud Configuration
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

# LM Studio Local Configuration
LM_STUDIO_URL = os.getenv("LM_STUDIO_URL", "http://127.0.0.1:1234/v1/chat/completions")
LM_STUDIO_MODEL = os.getenv("LM_STUDIO_MODEL", "phi-3-mini-4k-instruct")

print(f"AgriAI Chat Engine active provider: {LLM_PROVIDER.upper()}")


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
        weights=None  # Model weights will be populated from trained file
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


# Helper dependency to resolve current user
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


# ============================================================
# 6. HOME & HEALTH ENDPOINTS
# ============================================================

@app.get("/")
def home():
    db_mode = "Supabase PostgreSQL" if db.is_postgres() else "SQLite Local Storage"
    return {
        "project": "AgriAI",
        "purpose": "AI Farming Intelligence Platform",
        "status": "Backend is running",
        "database": db_mode,
        "llm_provider": LLM_PROVIDER.upper()
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "llm_provider": LLM_PROVIDER,
        "crop_model": "loaded" if crop_model is not None else "unavailable",
        "leaf_model": "loaded" if leaf_model is not None else "unavailable",
        "database": "postgresql" if db.is_postgres() else "sqlite"
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
# 9. AI FARMING CHATBOT (WITH PERSISTENT SQLITE LOGGING)
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

    # Configure target inference endpoint & model
    if LLM_PROVIDER == "groq":
        if not GROQ_API_KEY:
            raise HTTPException(
                status_code=500,
                detail="Groq Cloud API key is not configured. Please set GROQ_API_KEY in server environment."
            )
        target_url = GROQ_URL
        target_model = GROQ_MODEL
        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        provider_name = "Groq Cloud"
    else:
        target_url = LM_STUDIO_URL
        target_model = LM_STUDIO_MODEL
        headers = {
            "Content-Type": "application/json"
        }
        provider_name = "LM Studio"

    payload = {
        "model": target_model,
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

    try:
        response = requests.post(target_url, json=payload, headers=headers, timeout=60)
        response.raise_for_status()
        result = response.json()
        answer = result["choices"][0]["message"]["content"]

        session_id = request.session_id

        # If user is authenticated, automatically persist to database chat history
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
            detail=f"Cannot connect to {provider_name}. If running locally, make sure LM Studio is open at {LM_STUDIO_URL}."
        )
    except requests.exceptions.Timeout:
        raise HTTPException(
            status_code=504,
            detail=f"{provider_name} request timed out."
        )
    except requests.exceptions.HTTPError as error:
        status = response.status_code if 'response' in locals() else 500
        raise HTTPException(
            status_code=status,
            detail=f"{provider_name} error: {error}"
        )
    except requests.exceptions.RequestException as error:
        raise HTTPException(
            status_code=500,
            detail=f"{provider_name} request failed: {error}"
        )
    except (KeyError, IndexError):
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected response structure received from {provider_name}."
        )


# ============================================================
# 10. CROP RECOMMENDATION
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
# 11. LEAF DISEASE DETECTION
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
    Fetch real-time weather data for the farmer's coordinates using Open-Meteo
    and reverse geocode the location to city, region, country.
    """
    try:
        # 1. Reverse geocoding (BigDataCloud client-side free API or Nominatim fallback)
        city = ""
        region = ""
        country = ""
        
        try:
            geo_res = requests.get(
                f"https://api.bigdatacloud.net/data/reverse-geocode-client?latitude={lat}&longitude={lon}&localityLanguage=en",
                timeout=4
            )
            if geo_res.ok:
                geo_data = geo_res.json()
                city = geo_data.get("city") or geo_data.get("locality") or geo_data.get("principalSubdivision") or ""
                region = geo_data.get("principalSubdivision") or geo_data.get("countrySubdivision") or ""
                country = geo_data.get("countryName") or ""
        except Exception as geo_err:
            print(f"Primary reverse geocoding notice: {geo_err}")
            
        if not city:
            try:
                nom_res = requests.get(
                    f"https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat={lat}&lon={lon}",
                    headers={"User-Agent": "AgriAI-Weather/1.0"},
                    timeout=4
                )
                if nom_res.ok:
                    nom_data = nom_res.json()
                    addr = nom_data.get("address", {})
                    city = addr.get("city") or addr.get("town") or addr.get("village") or addr.get("county") or ""
                    region = addr.get("state") or addr.get("state_district") or ""
                    country = addr.get("country") or ""
            except Exception as nom_err:
                print(f"Fallback reverse geocoding notice: {nom_err}")

        # 2. Fetch real-time weather from Open-Meteo
        weather_url = (
            f"https://api.open-meteo.com/v1/forecast?"
            f"latitude={lat}&longitude={lon}&"
            f"current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&"
            f"daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&"
            f"timezone=auto"
        )
        
        weather_res = requests.get(weather_url, timeout=6)
        if not weather_res.ok:
            raise HTTPException(status_code=502, detail="Weather service returned an error.")
            
        w_data = weather_res.json()
        current = w_data.get("current", {})
        daily = w_data.get("daily", {})
        
        wmo_code = int(current.get("weather_code", 0))
        condition_text = wmo_code_to_condition(wmo_code)
        
        # Max/min daily temperatures
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