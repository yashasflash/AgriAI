/**
 * AgriAI — API Service Layer
 * Supports both local development (http://127.0.0.1:8000)
 * and production cloud backend via VITE_API_BASE_URL.
 */

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");
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

/**
 * 16. Smart Agricultural Market Intelligence (Live Mandi Prices)
 * Endpoints:
 * - GET /mandi/prices
 * - GET /mandi/filters
 * - GET /mandi/summary
 * - POST /mandi/sync
 */

export async function getMandiPrices({
  search = "",
  state = "",
  district = "",
  market = "",
  commodity = "",
  sort = "date_desc",
  page = 1,
  limit = 20,
} = {}) {
  try {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (state) params.append("state", state);
    if (district) params.append("district", district);
    if (market) params.append("market", market);
    if (commodity) params.append("commodity", commodity);
    if (sort) params.append("sort", sort);
    if (page) params.append("page", page);
    if (limit) params.append("limit", limit);

    const queryString = params.toString() ? `?${params.toString()}` : "";
    const res = await fetch(`${API_BASE_URL}/mandi/prices${queryString}`, {
      headers: getAuthHeaders(false),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new ApiError(data?.detail || "Failed to fetch mandi market prices", res.status, data?.detail);
    }
    return data;
  } catch (err) {
    console.error("Mandi prices API error:", err);
    if (err instanceof ApiError) throw err;
    throw new ApiError(err.message || "Network error fetching mandi prices", 0, err.message);
  }
}

export async function getMandiFilters(state = "") {
  try {
    const url = state
      ? `${API_BASE_URL}/mandi/filters?state=${encodeURIComponent(state)}`
      : `${API_BASE_URL}/mandi/filters`;
    const res = await fetch(url, { headers: getAuthHeaders(false) });
    const data = await res.json();
    if (!res.ok) {
      throw new ApiError(data?.detail || "Failed to fetch mandi filter options", res.status, data?.detail);
    }
    return data?.filters || { states: [], districts: [], markets: [], commodities: [] };
  } catch (err) {
    console.error("Mandi filters API error:", err);
    if (err instanceof ApiError) throw err;
    throw new ApiError(err.message || "Network error fetching mandi filters", 0, err.message);
  }
}

export async function getMandiSummary() {
  try {
    const res = await fetch(`${API_BASE_URL}/mandi/summary`, { headers: getAuthHeaders(false) });
    const data = await res.json();
    if (!res.ok) {
      throw new ApiError(data?.detail || "Failed to fetch mandi market summary", res.status, data?.detail);
    }
    return data?.summary || null;
  } catch (err) {
    console.error("Mandi summary API error:", err);
    if (err instanceof ApiError) throw err;
    throw new ApiError(err.message || "Network error fetching mandi summary", 0, err.message);
  }
}

export async function syncMandiData(apiKey = null) {
  try {
    const res = await fetch(`${API_BASE_URL}/mandi/sync`, {
      method: "POST",
      headers: getAuthHeaders(true),
      body: JSON.stringify({ api_key: apiKey || null }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new ApiError(data?.detail || "Failed to synchronize mandi data", res.status, data?.detail);
    }
    return data?.sync || data;
  } catch (err) {
    console.error("Mandi sync API error:", err);
    if (err instanceof ApiError) throw err;
    throw new ApiError(err.message || "Network error syncing mandi data", 0, err.message);
  }
}

/**
 * 17. Market Price Comparison (Cross-Mandi Arbitrage & Spread Analysis)
 * Endpoint: GET /mandi/compare?commodity=...&state=...&unit=...
 */
export async function getMandiComparison({ commodity, state = "", unit = "", variety = "" }) {
  try {
    const params = new URLSearchParams();
    if (commodity) params.append("commodity", commodity);
    if (state && state.toLowerCase() !== "all") params.append("state", state);
    if (unit && unit.toLowerCase() !== "all") params.append("unit", unit);
    if (variety && variety.toLowerCase() !== "all") params.append("variety", variety);

    const queryString = params.toString() ? `?${params.toString()}` : "";
    const res = await fetch(`${API_BASE_URL}/mandi/compare${queryString}`, {
      headers: getAuthHeaders(false),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new ApiError(data?.detail || "Failed to fetch market price comparison", res.status, data?.detail);
    }
    return data?.comparison || null;
  } catch (err) {
    console.error("Mandi comparison API error:", err);
    if (err instanceof ApiError) throw err;
    throw new ApiError(err.message || "Network error fetching market price comparison", 0, err.message);
  }
}

/**
 * 18. Best Market Suggestion MVP
 * Endpoint: GET /mandi/best-market?commodity=...&state=...&unit=...&variety=...
 */
export async function getBestMarketSuggestion({ commodity, state = "", unit = "", variety = "" }) {
  try {
    const params = new URLSearchParams();
    if (commodity) params.append("commodity", commodity);
    if (state && state.toLowerCase() !== "all") params.append("state", state);
    if (unit && unit.toLowerCase() !== "all") params.append("unit", unit);
    if (variety && variety.toLowerCase() !== "all") params.append("variety", variety);

    const queryString = params.toString() ? `?${params.toString()}` : "";
    const res = await fetch(`${API_BASE_URL}/mandi/best-market${queryString}`, {
      headers: getAuthHeaders(false),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new ApiError(data?.detail || "Failed to fetch best market suggestion", res.status, data?.detail);
    }
    return data?.recommendation || null;
  } catch (err) {
    console.error("Best market suggestion API error:", err);
    if (err instanceof ApiError) throw err;
    throw new ApiError(err.message || "Network error fetching best market suggestion", 0, err.message);
  }
}

/**
 * 19. Basic Selling Advice MVP
 * Endpoint: GET /mandi/selling-advice?commodity=...&state=...&market=...&variety=...&unit=...
 */
export async function getBasicSellingAdvice({ commodity, state = "", market = "", variety = "", unit = "" }) {
  try {
    const params = new URLSearchParams();
    if (commodity) params.append("commodity", commodity);
    if (state && state.toLowerCase() !== "all") params.append("state", state);
    if (market && market.toLowerCase() !== "all") params.append("market", market);
    if (variety && variety.toLowerCase() !== "all") params.append("variety", variety);
    if (unit && unit.toLowerCase() !== "all") params.append("unit", unit);

    const queryString = params.toString() ? `?${params.toString()}` : "";
    const res = await fetch(`${API_BASE_URL}/mandi/selling-advice${queryString}`, {
      headers: getAuthHeaders(false),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new ApiError(data?.detail || "Failed to fetch basic selling advice", res.status, data?.detail);
    }
    return data?.advice || null;
  } catch (err) {
    console.error("Selling advice API error:", err);
    if (err instanceof ApiError) throw err;
    throw new ApiError(err.message || "Network error fetching basic selling advice", 0, err.message);
  }
}

/**
 * 20. Statistical Mandi Price Trend Series (Feature 5 - Stage 6A/6B)
 * Endpoint: GET /mandi/trends/series?commodity=...&market=...&variety=...&state=...&unit=...&observations=...
 */
export async function getMandiTrendsSeries({
  commodity,
  market,
  variety = "",
  state = "",
  unit = "",
  observations = 30
}) {
  try {
    const params = new URLSearchParams();
    if (commodity) params.append("commodity", commodity);
    if (market) params.append("market", market);
    if (variety && variety.toLowerCase() !== "all") params.append("variety", variety);
    if (state && state.toLowerCase() !== "all") params.append("state", state);
    if (unit && unit.toLowerCase() !== "all") params.append("unit", unit);
    if (observations) params.append("observations", String(observations));

    const queryString = params.toString() ? `?${params.toString()}` : "";
    const res = await fetch(`${API_BASE_URL}/mandi/trends/series${queryString}`, {
      headers: getAuthHeaders(false),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new ApiError(data?.detail || "Failed to fetch mandi price trend series", res.status, data?.detail);
    }
    return data || null;
  } catch (err) {
    console.error("Mandi trends series API error:", err);
    if (err instanceof ApiError) throw err;
    throw new ApiError(err.message || "Network error fetching mandi price trend series", 0, err.message);
  }
}

/**
 * 21. Multi-Market Mandi Trends Summary (Feature 5 - Stage 6A/6B)
 * Endpoint: GET /mandi/trends/summary?commodity=...&state=...
 */
export async function getMandiTrendsSummary({ commodity, state = "" }) {
  try {
    const params = new URLSearchParams();
    if (commodity) params.append("commodity", commodity);
    if (state && state.toLowerCase() !== "all") params.append("state", state);

    const queryString = params.toString() ? `?${params.toString()}` : "";
    const res = await fetch(`${API_BASE_URL}/mandi/trends/summary${queryString}`, {
      headers: getAuthHeaders(false),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new ApiError(data?.detail || "Failed to fetch mandi trends summary", res.status, data?.detail);
    }
    return data || null;
  } catch (err) {
    console.error("Mandi trends summary API error:", err);
    if (err instanceof ApiError) throw err;
    throw new ApiError(err.message || "Network error fetching mandi trends summary", 0, err.message);
  }
}

/**
 * 22. Historical Collection Status (Feature 5 - Stage 5/6)
 * Endpoint: GET /mandi/history/status
 */
export async function getMandiHistoryStatus() {
  try {
    const res = await fetch(`${API_BASE_URL}/mandi/history/status`, {
      headers: getAuthHeaders(false),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new ApiError(data?.detail || "Failed to fetch mandi history status", res.status, data?.detail);
    }
    return data?.history_status || null;
  } catch (err) {
    console.error("Mandi history status API error:", err);
    if (err instanceof ApiError) throw err;
    throw new ApiError(err.message || "Network error fetching mandi history status", 0, err.message);
  }
}

/**
 * 23. Mandi Forecast Readiness Assessment (Stage 7B)
 * Endpoint: GET /mandi/forecast/readiness
 */
export async function getMandiForecastReadiness() {
  try {
    const res = await fetch(`${API_BASE_URL}/mandi/forecast/readiness`, {
      headers: getAuthHeaders(false),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new ApiError(data?.detail || "Failed to fetch mandi forecast readiness", res.status, data?.detail);
    }
    return data?.forecast_readiness || data || null;
  } catch (err) {
    console.error("Mandi forecast readiness API error:", err);
    if (err instanceof ApiError) throw err;
    throw new ApiError(err.message || "Network error fetching mandi forecast readiness", 0, err.message);
  }
}

/**
 * 24. Mandi Forecast Series & Readiness Tier (Stage 7B)
 * Endpoint: GET /mandi/forecast/series?commodity=...&market=...
 */
export async function getMandiForecastSeries({ commodity, market, state = "", variety = "", unit = "" }) {
  try {
    const params = new URLSearchParams();
    if (commodity) params.append("commodity", commodity);
    if (market) params.append("market", market);
    if (state && state.toLowerCase() !== "all") params.append("state", state);
    if (variety && variety.toLowerCase() !== "all") params.append("variety", variety);
    if (unit && unit.toLowerCase() !== "all") params.append("unit", unit);

    const queryString = params.toString() ? `?${params.toString()}` : "";
    const res = await fetch(`${API_BASE_URL}/mandi/forecast/series${queryString}`, {
      headers: getAuthHeaders(false),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new ApiError(data?.detail || "Failed to fetch mandi forecast series", res.status, data?.detail);
    }
    return data || null;
  } catch (err) {
    console.error("Mandi forecast series API error:", err);
    if (err instanceof ApiError) throw err;
    throw new ApiError(err.message || "Network error fetching mandi forecast series", 0, err.message);
  }
}

/**
 * 25. Mandi Forecast Naive Baseline Benchmark (Stage 7B)
 * Endpoint: GET /mandi/forecast/baseline?commodity=...&market=...
 */
export async function getMandiForecastBaseline({ commodity, market, state = "", variety = "", unit = "" }) {
  try {
    const params = new URLSearchParams();
    if (commodity) params.append("commodity", commodity);
    if (market) params.append("market", market);
    if (state && state.toLowerCase() !== "all") params.append("state", state);
    if (variety && variety.toLowerCase() !== "all") params.append("variety", variety);
    if (unit && unit.toLowerCase() !== "all") params.append("unit", unit);

    const queryString = params.toString() ? `?${params.toString()}` : "";
    const res = await fetch(`${API_BASE_URL}/mandi/forecast/baseline${queryString}`, {
      headers: getAuthHeaders(false),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new ApiError(data?.detail || "Failed to fetch mandi forecast baseline", res.status, data?.detail);
    }
    return data || null;
  } catch (err) {
    console.error("Mandi forecast baseline API error:", err);
    if (err instanceof ApiError) throw err;
    throw new ApiError(err.message || "Network error fetching mandi forecast baseline", 0, err.message);
  }
}



