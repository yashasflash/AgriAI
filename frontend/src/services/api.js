/**
 * AgriAI — API Service Layer
 * Direct connection to local FastAPI backend (http://127.0.0.1:8000)
 * All authentication, chat sessions, ML inference, and user data stay 100% local.
 */

const API_BASE_URL = "http://127.0.0.1:8000";
const TOKEN_STORAGE_KEY = "agriai_auth_token";
const USER_STORAGE_KEY = "agriai_user_info";

/**
 * Token and Local Session helpers
 */
export function getStoredToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY) || "";
}

export function setStoredSession(token, user) {
  if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
  if (user) localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

export function getStoredUser() {
  const data = localStorage.getItem(USER_STORAGE_KEY);
  try {
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function clearStoredSession() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
}

function getAuthHeaders(includeJson = true) {
  const headers = {};
  if (includeJson) {
    headers["Content-Type"] = "application/json";
  }
  const token = getStoredToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * 1. Health check
 */
export async function getHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/health`);
    if (!res.ok) throw new Error(`Backend returned status ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Health check error:", err);
    throw err;
  }
}

/**
 * 2. Authentication: Register Local User
 */
export async function registerUser({ name, password, language = "en" }) {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, password, language }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.detail || "An account with this name already exists.");
    }

    if (data.token && data.user) {
      setStoredSession(data.token, data.user);
    }
    return data;
  } catch (err) {
    console.error("Registration error:", err);
    throw err;
  }
}

/**
 * 3. Authentication: Login Local User
 */
export async function loginUser({ name, password }) {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.detail || "Name or password is incorrect.");
    }

    if (data.token && data.user) {
      setStoredSession(data.token, data.user);
    }
    return data;
  } catch (err) {
    console.error("Login error:", err);
    throw err;
  }
}

/**
 * 4. Authentication: Get Profile
 */
export async function getProfile() {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: "GET",
      headers: getAuthHeaders(true),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.detail || "Failed to load profile");
    }
    return data.user;
  } catch (err) {
    console.error("Get profile error:", err);
    throw err;
  }
}

/**
 * 5. Authentication: Update Profile
 */
export async function updateProfile({ name, language, current_password, new_password }) {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: "PUT",
      headers: getAuthHeaders(true),
      body: JSON.stringify({ name, language, current_password, new_password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.detail || "Failed to update profile");
    }
    if (data.user) {
      const currentToken = getStoredToken();
      setStoredSession(currentToken, data.user);
    }
    return data.user;
  } catch (err) {
    console.error("Update profile error:", err);
    throw err;
  }
}

/**
 * 6. Authentication: Logout
 */
export async function logoutUser() {
  try {
    const token = getStoredToken();
    if (token) {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: getAuthHeaders(false),
      }).catch(() => {});
    }
  } finally {
    clearStoredSession();
  }
}

/**
 * 7. Chat Assistant
 * Endpoint: POST /chat
 */
export async function sendChatMessage(message, sessionId = null, language = "en") {
  try {
    const res = await fetch(`${API_BASE_URL}/chat`, {
      method: "POST",
      headers: getAuthHeaders(true),
      body: JSON.stringify({
        message,
        session_id: sessionId,
        language
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.detail || "AgriAI is temporarily unavailable. Please make sure the local AI service is running.");
    }
    return data;
  } catch (err) {
    console.error("Send chat message error:", err);
    throw err;
  }
}

/**
 * 8. Chat History Sessions List
 * Endpoint: GET /chat/history?q=...
 */
export async function getChatHistory(searchQuery = "") {
  try {
    const url = searchQuery
      ? `${API_BASE_URL}/chat/history?q=${encodeURIComponent(searchQuery)}`
      : `${API_BASE_URL}/chat/history`;

    const res = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(true),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.detail || "Failed to load chat history");
    }
    return data.sessions || [];
  } catch (err) {
    console.error("Get chat history error:", err);
    throw err;
  }
}

/**
 * 9. Chat Session Detail (Messages)
 * Endpoint: GET /chat/history/{session_id}
 */
export async function getConversation(sessionId) {
  try {
    const res = await fetch(`${API_BASE_URL}/chat/history/${sessionId}`, {
      method: "GET",
      headers: getAuthHeaders(true),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.detail || "Conversation not found");
    }
    return data.session;
  } catch (err) {
    console.error("Get conversation error:", err);
    throw err;
  }
}

/**
 * 10. Create New Chat Session
 * Endpoint: POST /chat/new
 */
export async function createNewChat(title = "New Farming Chat") {
  try {
    const res = await fetch(`${API_BASE_URL}/chat/new`, {
      method: "POST",
      headers: getAuthHeaders(true),
      body: JSON.stringify({ title }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.detail || "Failed to create new chat");
    }
    return data;
  } catch (err) {
    console.error("Create new chat error:", err);
    throw err;
  }
}

/**
 * 11. Delete Single Chat Session
 * Endpoint: DELETE /chat/history/{session_id}
 */
export async function deleteConversation(sessionId) {
  try {
    const res = await fetch(`${API_BASE_URL}/chat/history/${sessionId}`, {
      method: "DELETE",
      headers: getAuthHeaders(true),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.detail || "Failed to delete conversation");
    }
    return data;
  } catch (err) {
    console.error("Delete conversation error:", err);
    throw err;
  }
}

/**
 * 12. Clear All Chat History
 * Endpoint: DELETE /chat/history
 */
export async function clearChatHistory() {
  try {
    const res = await fetch(`${API_BASE_URL}/chat/history`, {
      method: "DELETE",
      headers: getAuthHeaders(true),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.detail || "Failed to clear chat history");
    }
    return data;
  } catch (err) {
    console.error("Clear chat history error:", err);
    throw err;
  }
}

/**
 * 13. Crop Recommendation ML Model
 * Endpoint: POST /crop-recommendation
 */
export async function recommendCrop(data) {
  try {
    const res = await fetch(`${API_BASE_URL}/crop-recommendation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        N: Number(data.N),
        P: Number(data.P),
        K: Number(data.K),
        temperature: Number(data.temperature),
        humidity: Number(data.humidity),
        ph: Number(data.ph),
        rainfall: Number(data.rainfall),
      }),
    });

    const result = await res.json();
    if (!res.ok) {
      throw new Error(result?.detail || "Unable to generate a crop recommendation. Please check your inputs.");
    }
    return result;
  } catch (err) {
    console.error("Crop API error:", err);
    throw err;
  }
}

/**
 * 14. Leaf Health Detection MobileNetV2 Model
 * Endpoint: POST /leaf-disease
 */
export async function checkLeaf(file) {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_BASE_URL}/leaf-disease`, {
      method: "POST",
      body: formData,
    });

    const result = await res.json();
    if (!res.ok) {
      throw new Error(result?.detail || "Unable to analyze this image. Please try a clearer leaf photo.");
    }
    return result;
  } catch (err) {
    console.error("Leaf API error:", err);
    throw err;
  }
}

/**
 * 15. Real-Time Weather API
 * Endpoint: GET /weather?lat=...&lon=...
 */
export async function getWeatherData(lat, lon) {
  try {
    const res = await fetch(
      `${API_BASE_URL}/weather?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`
    );

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.detail || "Weather service temporarily unavailable");
    }
    return data;
  } catch (err) {
    console.error("Weather API error:", err);
    throw err;
  }
}




