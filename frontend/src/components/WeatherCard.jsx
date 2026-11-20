import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from '../i18n';
import { getWeatherData } from '../services/api';

export const WEATHER_MODE_STORAGE_KEY = 'agriai_weather_mode';
export const WEATHER_LOCATION_STORAGE_KEY = 'agriai_weather_location';

export const PREDEFINED_LOCATIONS = [
  { id: 'mysuru', name: 'Mysuru', region: 'Karnataka', lat: 12.2958, lon: 76.6394 },
  { id: 'bengaluru', name: 'Bengaluru', region: 'Karnataka', lat: 12.9716, lon: 77.5946 },
  { id: 'mandya', name: 'Mandya', region: 'Karnataka', lat: 12.5222, lon: 76.8978 },
  { id: 'belagavi', name: 'Belagavi', region: 'Karnataka', lat: 15.8497, lon: 74.4977 },
  { id: 'shivamogga', name: 'Shivamogga', region: 'Karnataka', lat: 13.9299, lon: 75.5681 },
  { id: 'hassan', name: 'Hassan', region: 'Karnataka', lat: 13.0072, lon: 76.0962 },
  { id: 'hubballi', name: 'Hubballi', region: 'Karnataka', lat: 15.3647, lon: 75.1240 },
  { id: 'davangere', name: 'Davangere', region: 'Karnataka', lat: 14.4644, lon: 75.9218 },
  { id: 'ballari', name: 'Ballari', region: 'Karnataka', lat: 15.1394, lon: 76.9214 },
  { id: 'kalaburagi', name: 'Kalaburagi', region: 'Karnataka', lat: 17.3297, lon: 76.8343 },
  { id: 'pune', name: 'Pune', region: 'Maharashtra', lat: 18.5204, lon: 73.8567 },
  { id: 'indore', name: 'Indore', region: 'Madhya Pradesh', lat: 22.7196, lon: 75.8577 },
  { id: 'varanasi', name: 'Varanasi', region: 'Uttar Pradesh', lat: 25.3176, lon: 82.9739 },
  { id: 'ludhiana', name: 'Ludhiana', region: 'Punjab', lat: 30.9010, lon: 75.8573 },
  { id: 'hyderabad', name: 'Hyderabad', region: 'Telangana', lat: 17.3850, lon: 78.4867 },
  { id: 'coimbatore', name: 'Coimbatore', region: 'Tamil Nadu', lat: 11.0168, lon: 76.9558 },
  { id: 'guntur', name: 'Guntur', region: 'Andhra Pradesh', lat: 16.3067, lon: 80.4365 },
];

export default function WeatherCard({ onApplyWeather }) {
  const { t } = useTranslation();

  const [weatherMode, setWeatherMode] = useState(() => {
    return localStorage.getItem(WEATHER_MODE_STORAGE_KEY) || 'online';
  });

  const [selectedLocation, setSelectedLocation] = useState(() => {
    try {
      const saved = localStorage.getItem(WEATHER_LOCATION_STORAGE_KEY);
      return saved ? JSON.parse(saved) : PREDEFINED_LOCATIONS[0];
    } catch {
      return PREDEFINED_LOCATIONS[0];
    }
  });

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [weather, setWeather] = useState(null);
  const [errorNotice, setErrorNotice] = useState(null);
  const [lastUpdatedTime, setLastUpdatedTime] = useState(null);
  const [timeAgoText, setTimeAgoText] = useState('');

  // Modals / Dialogs
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [locationSearchQuery, setLocationSearchQuery] = useState('');

  // Listen to weather mode changes from Settings
  useEffect(() => {
    const handleModeChange = () => {
      const mode = localStorage.getItem(WEATHER_MODE_STORAGE_KEY) || 'online';
      setWeatherMode(mode);
    };
    window.addEventListener('storage', handleModeChange);
    window.addEventListener('agriai_weather_mode_changed', handleModeChange);
    return () => {
      window.removeEventListener('storage', handleModeChange);
      window.removeEventListener('agriai_weather_mode_changed', handleModeChange);
    };
  }, []);

  // Calculate relative time string
  const updateRelativeTime = useCallback(() => {
    if (!lastUpdatedTime) return;
    const diffSec = Math.floor((Date.now() - lastUpdatedTime) / 1000);
    if (diffSec < 60) {
      setTimeAgoText(t.weather?.updatedJustNow || 'Updated just now');
    } else if (diffSec < 3600) {
      const mins = Math.floor(diffSec / 60);
      setTimeAgoText(
        (t.weather?.updatedMinAgo || 'Updated {n} min ago').replace('{n}', mins)
      );
    } else {
      const hours = Math.floor(diffSec / 3600);
      setTimeAgoText(
        (t.weather?.updatedHoursAgo || 'Updated {n}h ago').replace('{n}', hours)
      );
    }
  }, [lastUpdatedTime, t]);

  useEffect(() => {
    updateRelativeTime();
    const interval = setInterval(updateRelativeTime, 30000);
    return () => clearInterval(interval);
  }, [updateRelativeTime]);

  // Fetch weather for coordinates
  const fetchWeather = useCallback(async (lat, lon, isRefresh = false) => {
    if (weatherMode === 'offline') {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setErrorNotice(null);

    try {
      const data = await getWeatherData(lat, lon);
      setWeather(data);
      setLastUpdatedTime(Date.now());
      setErrorNotice(null);
    } catch (err) {
      console.warn('Weather fetch error:', err);
      setErrorNotice(t.weather?.weatherErrorDesc || 'Check your connection and try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [weatherMode, t]);

  // Trigger fetch when location or mode changes
  useEffect(() => {
    if (weatherMode === 'online' && selectedLocation) {
      fetchWeather(selectedLocation.lat, selectedLocation.lon);
    } else {
      setLoading(false);
    }
  }, [selectedLocation, weatherMode, fetchWeather]);

  // Handle location selection
  const handleSelectLocation = (loc) => {
    setSelectedLocation(loc);
    localStorage.setItem(WEATHER_LOCATION_STORAGE_KEY, JSON.stringify(loc));
    setLocationPickerOpen(false);
    setLocationSearchQuery('');
  };

  // Handle Auto GPS Geolocation
  const handleUseGPSLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setLoading(true);
    setLocationPickerOpen(false);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const gpsLoc = {
          id: 'gps_current',
          name: 'Current Location',
          region: 'GPS Detected',
          lat: latitude,
          lon: longitude
        };
        setSelectedLocation(gpsLoc);
        localStorage.setItem(WEATHER_LOCATION_STORAGE_KEY, JSON.stringify(gpsLoc));
      },
      (err) => {
        console.warn('GPS error:', err);
        setLoading(false);
        setErrorNotice(t.weather?.locationDenied || 'Location access is unavailable');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  // Switch to online mode
  const handleSwitchToOnline = () => {
    localStorage.setItem(WEATHER_MODE_STORAGE_KEY, 'online');
    setWeatherMode('online');
    window.dispatchEvent(new Event('agriai_weather_mode_changed'));
  };

  // Helper for animated 3D Weather Icon
  const renderWeatherArt = (weatherCode, isDay = 1) => {
    // 1. Clear Sky / Sunny
    if (weatherCode === 0 || weatherCode === 1) {
      return (
        <div className="agri-weather-art-box sunny-glow" style={{ position: 'relative', width: '74px', height: '74px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Ambient Glow */}
          <div style={{ position: 'absolute', inset: '6px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(245, 158, 11, 0.45) 0%, rgba(234, 179, 8, 0.15) 50%, transparent 70%)', filter: 'blur(8px)', animation: 'sunPulse 3.5s ease-in-out infinite alternate' }} />
          {/* 3D Glass Sun Spherical Body */}
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #fef08a 0%, #f59e0b 50%, #d97706 100%)', boxShadow: '0 8px 20px -2px rgba(245, 158, 11, 0.45), inset 0 2px 4px rgba(255, 255, 255, 0.8), inset 0 -3px 6px rgba(180, 83, 9, 0.4)', position: 'relative', zIndex: 2, animation: 'sunFloat 4s ease-in-out infinite alternate' }}>
            {/* Specular Highlight */}
            <div style={{ position: 'absolute', top: '7px', left: '9px', width: '12px', height: '8px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.75)', transform: 'rotate(-30deg)', filter: 'blur(1px)' }} />
          </div>
          {/* Subtle Outer Rays Ring */}
          <svg width="74" height="74" viewBox="0 0 74 74" style={{ position: 'absolute', inset: 0, animation: 'sunRaysSpin 24s linear infinite', zIndex: 1 }}>
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
              <line key={deg} x1="37" y1="6" x2="37" y2="10" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" transform={`rotate(${deg} 37 37)`} opacity="0.8" />
            ))}
          </svg>
        </div>
      );
    }

    // 2. Partly Cloudy
    if (weatherCode === 2 || weatherCode === 3) {
      return (
        <div className="agri-weather-art-box" style={{ position: 'relative', width: '74px', height: '74px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Behind Sun */}
          <div style={{ position: 'absolute', top: '10px', right: '12px', width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg, #fde047 0%, #f59e0b 100%)', boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35), inset 0 1px 2px #fff', zIndex: 1, animation: 'sunFloat 4.5s ease-in-out infinite alternate' }} />
          {/* Front Soft Glass Cloud */}
          <div style={{ position: 'absolute', bottom: '12px', left: '10px', zIndex: 2, animation: 'cloudDrift 5s ease-in-out infinite alternate' }}>
            <svg width="54" height="36" viewBox="0 0 54 36" fill="none">
              <path d="M14 30H41C46 30 50 26 50 21C50 16.5 46.5 13 42 12.5C40.5 6 34.5 1.5 27.5 1.5C20.5 1.5 14.8 6.2 13.2 13C6.5 14 1.5 19.5 1.5 26.2C1.5 32 6.5 36.8 14 30Z" fill="url(#partlyCloudGrad)" />
              <path d="M14 30H41C46 30 50 26 50 21C50 16.5 46.5 13 42 12.5C40.5 6 34.5 1.5 27.5 1.5C20.5 1.5 14.8 6.2 13.2 13C6.5 14 1.5 19.5 1.5 26.2C1.5 32 6.5 36.8 14 30Z" stroke="rgba(255, 255, 255, 0.85)" strokeWidth="1.2" />
              <defs>
                <linearGradient id="partlyCloudGrad" x1="10" y1="2" x2="45" y2="34" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#ffffff" stopOpacity="0.95" />
                  <stop offset="0.6" stopColor="#e2e8f0" stopOpacity="0.85" />
                  <stop offset="1" stopColor="#cbd5e1" stopOpacity="0.8" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      );
    }

    // 3. Rain / Drizzle
    if ((weatherCode >= 51 && weatherCode <= 67) || (weatherCode >= 80 && weatherCode <= 82)) {
      return (
        <div className="agri-weather-art-box" style={{ position: 'relative', width: '74px', height: '74px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Dark Glass Cloud */}
          <div style={{ position: 'absolute', top: '10px', zIndex: 2, animation: 'cloudDrift 4s ease-in-out infinite alternate' }}>
            <svg width="56" height="36" viewBox="0 0 54 36" fill="none">
              <path d="M14 30H41C46 30 50 26 50 21C50 16.5 46.5 13 42 12.5C40.5 6 34.5 1.5 27.5 1.5C20.5 1.5 14.8 6.2 13.2 13C6.5 14 1.5 19.5 1.5 26.2C1.5 32 6.5 36.8 14 30Z" fill="url(#rainCloudGrad)" />
              <path d="M14 30H41C46 30 50 26 50 21C50 16.5 46.5 13 42 12.5C40.5 6 34.5 1.5 27.5 1.5C20.5 1.5 14.8 6.2 13.2 13C6.5 14 1.5 19.5 1.5 26.2C1.5 32 6.5 36.8 14 30Z" stroke="rgba(255, 255, 255, 0.6)" strokeWidth="1.2" />
              <defs>
                <linearGradient id="rainCloudGrad" x1="10" y1="2" x2="45" y2="34" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#e2e8f0" stopOpacity="0.95" />
                  <stop offset="0.6" stopColor="#94a3b8" stopOpacity="0.9" />
                  <stop offset="1" stopColor="#64748b" stopOpacity="0.85" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          {/* Animated Falling Rain Drops */}
          <div style={{ position: 'absolute', bottom: '8px', display: 'flex', gap: '8px', zIndex: 3 }}>
            <div className="rain-drop drop-1" style={{ width: '2.5px', height: '9px', background: '#38bdf8', borderRadius: '2px', animation: 'rainDropAnim 1.1s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
            <div className="rain-drop drop-2" style={{ width: '2.5px', height: '9px', background: '#0284c7', borderRadius: '2px', animation: 'rainDropAnim 1.1s cubic-bezier(0.4, 0, 0.6, 1) 0.35s infinite' }} />
            <div className="rain-drop drop-3" style={{ width: '2.5px', height: '9px', background: '#38bdf8', borderRadius: '2px', animation: 'rainDropAnim 1.1s cubic-bezier(0.4, 0, 0.6, 1) 0.7s infinite' }} />
          </div>
        </div>
      );
    }

    // 4. Thunderstorm
    if (weatherCode >= 95) {
      return (
        <div className="agri-weather-art-box" style={{ position: 'relative', width: '74px', height: '74px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Dark Thunder Cloud */}
          <div style={{ position: 'absolute', top: '10px', zIndex: 2 }}>
            <svg width="56" height="36" viewBox="0 0 54 36" fill="none">
              <path d="M14 30H41C46 30 50 26 50 21C50 16.5 46.5 13 42 12.5C40.5 6 34.5 1.5 27.5 1.5C20.5 1.5 14.8 6.2 13.2 13C6.5 14 1.5 19.5 1.5 26.2C1.5 32 6.5 36.8 14 30Z" fill="url(#stormCloudGrad)" />
              <path d="M14 30H41C46 30 50 26 50 21C50 16.5 46.5 13 42 12.5C40.5 6 34.5 1.5 27.5 1.5C20.5 1.5 14.8 6.2 13.2 13C6.5 14 1.5 19.5 1.5 26.2C1.5 32 6.5 36.8 14 30Z" stroke="rgba(255, 255, 255, 0.5)" strokeWidth="1.2" />
              <defs>
                <linearGradient id="stormCloudGrad" x1="10" y1="2" x2="45" y2="34" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#64748b" stopOpacity="0.95" />
                  <stop offset="0.6" stopColor="#334155" stopOpacity="0.9" />
                  <stop offset="1" stopColor="#1e293b" stopOpacity="0.95" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          {/* Glowing Lightning Bolt */}
          <div style={{ position: 'absolute', bottom: '6px', left: '26px', zIndex: 3, animation: 'thunderGleam 2.8s ease-in-out infinite' }}>
            <svg width="18" height="24" viewBox="0 0 18 24" fill="none">
              <path d="M10 1L2 12H9L7 23L16 10H10L12 1Z" fill="#facc15" stroke="#ca8a04" strokeWidth="1" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      );
    }

    // 5. Default Fog / Mist / Atmosphere
    return (
      <div className="agri-weather-art-box" style={{ position: 'relative', width: '74px', height: '74px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
        <div style={{ width: '48px', height: '5px', borderRadius: '4px', background: 'linear-gradient(90deg, transparent, #94a3b8, transparent)', animation: 'fogFloat 3s ease-in-out infinite alternate' }} />
        <div style={{ width: '56px', height: '5px', borderRadius: '4px', background: 'linear-gradient(90deg, transparent, #cbd5e1, transparent)', animation: 'fogFloat 3.5s ease-in-out 0.5s infinite alternate' }} />
        <div style={{ width: '42px', height: '5px', borderRadius: '4px', background: 'linear-gradient(90deg, transparent, #94a3b8, transparent)', animation: 'fogFloat 4s ease-in-out 1s infinite alternate' }} />
      </div>
    );
  };

  // Filtered locations for search
  const filteredLocations = PREDEFINED_LOCATIONS.filter((loc) => {
    const q = locationSearchQuery.toLowerCase().trim();
    return loc.name.toLowerCase().includes(q) || loc.region.toLowerCase().includes(q);
  });

  // Extract display values from backend response
  const weatherData = weather?.weather || {};
  const currentTemp = weatherData.temperature !== undefined ? `${Math.round(weatherData.temperature)}°C` : '--°C';
  const conditionText = weatherData.condition || 'Clear Sky';
  const weatherCode = weatherData.weatherCode ?? 0;
  const humidityVal = weatherData.humidity !== undefined ? `${weatherData.humidity}%` : '--';
  const windVal = weatherData.windSpeed !== undefined ? `${weatherData.windSpeed} km/h` : '--';
  const rainProbVal = weatherData.rainProbability !== undefined ? `${weatherData.rainProbability}%` : (weatherData.precipitation !== undefined && weatherData.precipitation !== null ? `${weatherData.precipitation} mm` : '15%');
  const cityName = selectedLocation?.name || weather?.location?.city || 'Mysuru';
  const regionName = selectedLocation?.region || weather?.location?.region || 'Karnataka';

  // ============================================================
  // RENDER: OFFLINE MODE WIDGET
  // ============================================================
  if (weatherMode === 'offline') {
    return (
      <>
        <div
          className="agri-glass-weather-widget offline-mode"
          style={{
            width: '100%',
            maxWidth: '100%',
            margin: 0,
            background: 'rgba(255, 255, 255, 0.76)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(22, 101, 52, 0.12)',
            borderRadius: '22px',
            padding: '1rem 1.25rem',
            boxShadow: '0 12px 30px -6px rgba(15, 56, 30, 0.06), 0 2px 8px -2px rgba(15, 56, 30, 0.02), inset 0 1px 2px rgba(255, 255, 255, 0.95)',
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {/* Soft Gleam Layer */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.9) 50%, transparent 100%)' }} />

          {/* Top Bar: Location & Status */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.84rem', fontWeight: 700, color: 'var(--color-green-dark)' }}>
              <span>📍</span>
              <span>{cityName}, {regionName}</span>
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.18rem 0.6rem',
                borderRadius: 'var(--radius-full)',
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                fontSize: '0.7rem',
                fontWeight: 800,
                color: '#475569',
                letterSpacing: '0.04em'
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#64748b' }} />
              <span>{t.weather?.offlineBadge || 'OFFLINE'}</span>
            </div>
          </div>

          {/* Main Card Center Content */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.2rem 0' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #f8fafc, #e2e8f0)',
                border: '1px solid #cbd5e1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.45rem',
                boxShadow: 'inset 0 1px 2px #fff',
                flexShrink: 0
              }}
            >
              🌱
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1e293b', marginBottom: '0.15rem' }}>
                {t.weather?.offlineTitle || 'Weather unavailable offline'}
              </div>
              <div style={{ fontSize: '0.76rem', color: '#64748b', lineHeight: 1.3 }}>
                {t.weather?.offlineSubtitle || 'Switch to Online mode for live weather.'}
              </div>
            </div>

            <button
              type="button"
              onClick={handleSwitchToOnline}
              style={{
                padding: '0.4rem 0.8rem',
                borderRadius: 'var(--radius-full)',
                background: 'var(--color-green-subtle)',
                border: '1px solid var(--border-green)',
                color: 'var(--color-green-dark)',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#bbf7d0';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--color-green-subtle)';
                e.currentTarget.style.transform = 'none';
              }}
            >
              {t.weather?.switchToOnline || 'Switch Online'}
            </button>
          </div>
        </div>
      </>
    );
  }

  // ============================================================
  // RENDER: ONLINE LIVE WEATHER WIDGET
  // ============================================================
  return (
    <>
      <div
        className="agri-glass-weather-widget online-mode"
        style={{
          width: '100%',
          maxWidth: '100%',
          margin: 0,
          background: 'rgba(255, 255, 255, 0.88)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1.5px solid rgba(255, 255, 255, 0.95)',
          borderRadius: '26px',
          padding: '1.25rem 1.4rem',
          boxShadow: '0 20px 48px -12px rgba(15, 56, 30, 0.1), 0 4px 16px -2px rgba(15, 56, 30, 0.04)',
          position: 'relative',
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={() => setDetailModalOpen(true)}
      >
        {/* Top Edge Specular Light Reflection */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1.5px', background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.95) 50%, transparent 100%)' }} />

        {/* Top Bar: Clickable Location Badge & LIVE / Refresh Status */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
          {/* Location Button (Opens Selector) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLocationPickerOpen(true);
            }}
            title={t.weather?.selectCity || 'Change Location'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 'var(--radius-full)',
              padding: '0.32rem 0.85rem',
              color: '#1e293b',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
              transition: 'all 0.18s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#86efac';
              e.currentTarget.style.background = '#f0fdf4';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.background = '#ffffff';
            }}
          >
            <span>📍</span>
            <span>{cityName}</span>
            <span style={{ fontSize: '0.65rem', opacity: 0.65, marginLeft: '2px' }}>▼</span>
          </button>

          {/* Right Status Indicator: Pulse LIVE & Refresh Icon */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }} onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.24rem 0.65rem',
                borderRadius: 'var(--radius-full)',
                background: '#22c55e',
                border: '1px solid #86efac',
                fontSize: '0.72rem',
                fontWeight: 800,
                color: '#ffffff',
                letterSpacing: '0.04em',
                boxShadow: '0 2px 8px rgba(34, 197, 94, 0.35)'
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  boxShadow: '0 0 4px #ffffff'
                }}
              />
              <span>{t.weather?.liveBadge || 'LIVE'}</span>
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (selectedLocation) {
                  fetchWeather(selectedLocation.lat, selectedLocation.lon, true);
                }
              }}
              title={t.weather?.refreshBtn || 'Refresh'}
              aria-label="Refresh Weather"
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                color: '#475569',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '0.88rem',
                fontWeight: 800,
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f8fafc';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#ffffff';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <span className={refreshing || loading ? 'weather-refresh-spin' : ''}>↻</span>
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* Center: Animated Weather Icon + Temperature + Condition     */}
        {/* ============================================================ */}
        {loading && !weather ? (
          /* Shimmer Loading Skeleton */
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: '1.25rem 0', gap: '0.5rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid #cbd5e1', borderTopColor: 'var(--color-green-main)', animation: 'weatherRefreshSpin 0.75s linear infinite' }} />
            <div style={{ fontSize: '0.82rem', color: '#475569', fontWeight: 600 }}>
              {t.weather?.fetchingWeather || 'Fetching live weather...'}
            </div>
          </div>
        ) : errorNotice && !weather ? (
          /* Error State */
          <div style={{ textAlign: 'center', padding: '0.75rem 0' }}>
            <div style={{ fontSize: '1.8rem', marginBottom: '0.2rem' }}>🌦️</div>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>
              {t.weather?.weatherError || 'Weather unavailable'}
            </div>
            <div style={{ fontSize: '0.76rem', color: '#64748b', marginBottom: '0.5rem' }}>
              {errorNotice}
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (selectedLocation) fetchWeather(selectedLocation.lat, selectedLocation.lon);
              }}
              style={{
                padding: '0.35rem 0.85rem',
                borderRadius: 'var(--radius-full)',
                background: 'var(--color-green-dark)',
                color: '#ffffff',
                fontSize: '0.76rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer'
              }}
            >
              {t.weather?.tryAgainBtn || 'Retry'}
            </button>
          </div>
        ) : (
          /* Live Weather Content */
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.25rem 0.25rem 0.85rem' }}>
              {/* Left: Floating 3D Animated Weather Illustration */}
              <div style={{ transform: 'scale(1.05)', transformOrigin: 'left center' }}>
                {renderWeatherArt(weatherCode)}
              </div>

              {/* Right: Large Bold Temperature & Condition */}
              <div style={{ textAlign: 'right' }}>
                <div
                  style={{
                    fontSize: '2.45rem',
                    fontWeight: 900,
                    lineHeight: 1,
                    color: 'var(--color-green-dark)',
                    letterSpacing: '-0.04em',
                    marginBottom: '0.25rem'
                  }}
                >
                  {currentTemp}
                </div>
                <div
                  style={{
                    fontSize: '0.96rem',
                    fontWeight: 800,
                    color: '#1e293b',
                    letterSpacing: '-0.01em'
                  }}
                >
                  {conditionText}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px', fontWeight: 500 }}>
                  {regionName}
                </div>
              </div>
            </div>

            {/* Bottom Row: Supporting Frosted Metrics Pills */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 90px), 1fr))',
                gap: '0.45rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid rgba(15, 56, 30, 0.08)'
              }}
            >
              {/* Humidity */}
              <div
                style={{
                  background: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  padding: '0.4rem 0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.82rem', flexShrink: 0 }}>
                  💧
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600, lineHeight: 1 }}>
                    {t.weather?.humidity || 'Humidity'}
                  </div>
                  <div style={{ fontSize: '0.84rem', color: '#0f172a', fontWeight: 800, marginTop: '2px' }}>
                    {humidityVal}
                  </div>
                </div>
              </div>

              {/* Wind Speed */}
              <div
                style={{
                  background: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  padding: '0.4rem 0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.82rem', flexShrink: 0 }}>
                  💨
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600, lineHeight: 1 }}>
                    {t.weather?.wind || 'Wind'}
                  </div>
                  <div style={{ fontSize: '0.84rem', color: '#0f172a', fontWeight: 800, marginTop: '2px' }}>
                    {windVal}
                  </div>
                </div>
              </div>

              {/* Rain Chance */}
              <div
                style={{
                  background: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  padding: '0.4rem 0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.82rem', flexShrink: 0 }}>
                  🌧️
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600, lineHeight: 1 }}>
                    {t.weather?.rain || 'Rain chance'}
                  </div>
                  <div style={{ fontSize: '0.84rem', color: '#0f172a', fontWeight: 800, marginTop: '2px' }}>
                    {rainProbVal}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ============================================================ */}
      {/* 1. LOCATION PICKER MODAL                                    */}
      {/* ============================================================ */}
      {locationPickerOpen && (
        <div
          onClick={() => setLocationPickerOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '460px',
              background: '#ffffff',
              borderRadius: '24px',
              border: '1px solid rgba(22, 101, 52, 0.15)',
              padding: '1.75rem',
              boxShadow: '0 24px 54px -12px rgba(15, 56, 30, 0.22)',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-green-dark)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span>📍</span>
                <span>{t.weather?.selectCity || 'Select Farming Region'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setLocationPickerOpen(false)}
                style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#f1f5f9', border: 'none', cursor: 'pointer', fontWeight: 700, color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            {/* GPS Auto Detect Button */}
            <button
              type="button"
              onClick={handleUseGPSLocation}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1rem',
                borderRadius: '14px',
                background: 'var(--color-green-subtle)',
                border: '1px solid var(--border-green)',
                color: 'var(--color-green-dark)',
                fontSize: '0.86rem',
                fontWeight: 700,
                cursor: 'pointer',
                marginBottom: '0.85rem',
                transition: 'all 0.18s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#bbf7d0')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-green-subtle)')}
            >
              <span>🧭</span>
              <span>{t.weather?.allowLocationBtn || 'Use Current GPS Location'}</span>
            </button>

            {/* Search Input */}
            <div style={{ position: 'relative', marginBottom: '0.85rem' }}>
              <input
                type="text"
                placeholder={t.weather?.searchCity || 'Search farming region / city...'}
                value={locationSearchQuery}
                onChange={(e) => setLocationSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem 0.65rem 2.2rem',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.88rem',
                  outline: 'none',
                  background: '#f8fafc'
                }}
              />
              <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.9rem' }}>
                🔍
              </span>
            </div>

            {/* Cities Grid List */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: '300px', paddingRight: '4px' }}>
              {filteredLocations.map((loc) => {
                const isCurrent = selectedLocation?.id === loc.id;
                return (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => handleSelectLocation(loc)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '12px',
                      border: isCurrent ? '1.5px solid var(--color-green-main)' : '1px solid #f1f5f9',
                      background: isCurrent ? 'var(--color-green-subtle)' : '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isCurrent) e.currentTarget.style.background = '#f8fafc';
                    }}
                    onMouseLeave={(e) => {
                      if (!isCurrent) e.currentTarget.style.background = '#ffffff';
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: isCurrent ? 'var(--color-green-dark)' : '#1e293b' }}>
                        {loc.name}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                        {loc.region}
                      </div>
                    </div>
                    {isCurrent && (
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-green-main)' }}>
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. COMPACT WEATHER DETAILS MODAL                            */}
      {/* ============================================================ */}
      {detailModalOpen && (
        <div
          onClick={() => setDetailModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '480px',
              background: '#ffffff',
              borderRadius: '26px',
              border: '1px solid rgba(22, 101, 52, 0.15)',
              padding: '2rem',
              boxShadow: '0 24px 54px -12px rgba(15, 56, 30, 0.24)',
              animation: 'fadeUp 0.25s ease-out'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.3rem' }}>🌦️</span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-green-dark)', margin: 0 }}>
                  {t.weather?.weatherDetails || 'Weather Overview'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f1f5f9', border: 'none', cursor: 'pointer', fontWeight: 700, color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            {/* Overview Hero Inside Modal */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(220, 252, 231, 0.6) 0%, rgba(241, 245, 234, 0.8) 100%)',
                border: '1px solid var(--border-green)',
                borderRadius: '20px',
                padding: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1.25rem'
              }}
            >
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-green-dark)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span>📍</span>
                  <span>{cityName}, {regionName}</span>
                </div>
                <div style={{ fontSize: '2.4rem', fontWeight: 900, color: 'var(--color-green-dark)', margin: '0.2rem 0' }}>
                  {currentTemp}
                </div>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#334155' }}>
                  {conditionText}
                </div>
              </div>
              <div>
                {renderWeatherArt(weatherCode)}
              </div>
            </div>

            {/* Detailed 4-Grid Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                  {t.weather?.feelsLike || 'Feels Like'}
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1e293b', marginTop: '2px' }}>
                  {weatherData.feelsLike !== undefined ? `${Math.round(weatherData.feelsLike)}°C` : currentTemp}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                  {t.weather?.humidity || 'Humidity'}
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1e293b', marginTop: '2px' }}>
                  {humidityVal}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                  {t.weather?.wind || 'Wind Speed'}
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1e293b', marginTop: '2px' }}>
                  {windVal}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                  {t.weather?.rain || 'Rain Probability'}
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1e293b', marginTop: '2px' }}>
                  {rainProbVal || '0%'}
                </div>
              </div>
            </div>

            {/* Scientific Agronomic Tip */}
            <div
              style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '14px',
                padding: '0.75rem 1rem',
                fontSize: '0.82rem',
                color: '#166534',
                lineHeight: 1.4,
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <span>🌾</span>
              <span>
                {weatherData.temperature > 32
                  ? 'High temperature: ensure adequate irrigation during morning or evening hours.'
                  : weatherData.humidity > 80
                  ? 'High humidity: inspect lower leaves regularly for early fungal leaf spot.'
                  : 'Favorable field conditions for soil preparation, fertilizer application, and crop monitoring.'}
              </span>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setDetailModalOpen(false)}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: 'var(--radius-full)',
                background: 'linear-gradient(135deg, #0f381e, #166534)',
                color: '#ffffff',
                fontSize: '0.9rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(15, 56, 30, 0.2)'
              }}
            >
              {t.settings?.closeBtn || 'Close'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
