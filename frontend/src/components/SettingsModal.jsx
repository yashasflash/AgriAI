import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../i18n';

export const WEATHER_MODE_STORAGE_KEY = 'agriai_weather_mode';

export default function SettingsModal({ isOpen, onClose, user, onOpenProfile, onLogout }) {
  const { language, setLanguage, t } = useTranslation();
  const modalContentRef = useRef(null);

  const [weatherMode, setWeatherMode] = useState(() => {
    return localStorage.getItem(WEATHER_MODE_STORAGE_KEY) || 'online';
  });

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleWeatherModeChange = (mode) => {
    setWeatherMode(mode);
    localStorage.setItem(WEATHER_MODE_STORAGE_KEY, mode);
    window.dispatchEvent(new Event('agriai_weather_mode_changed'));
  };

  const handleLanguageChange = (langCode) => {
    setLanguage(langCode);
  };

  const handleBackdropClick = (e) => {
    if (modalContentRef.current && !modalContentRef.current.contains(e.target)) {
      onClose();
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
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
        ref={modalContentRef}
        style={{
          width: '100%',
          maxWidth: '520px',
          background: '#ffffff',
          borderRadius: '26px',
          border: '1px solid rgba(22, 101, 52, 0.15)',
          padding: '2rem',
          boxShadow: '0 20px 48px -10px rgba(15, 56, 30, 0.22)',
          animation: 'fadeUp 0.25s ease-out',
          position: 'relative',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.5rem',
            paddingBottom: '1rem',
            borderBottom: '1px solid rgba(22, 101, 52, 0.1)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                background: '#ffffff',
                border: '1px solid rgba(22, 101, 52, 0.16)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2px',
                boxShadow: '0 2px 8px rgba(15, 56, 30, 0.1)',
                overflow: 'hidden',
                flexShrink: 0
              }}
            >
              <img
                src="/images/agriai-emblem-transparent.png"
                alt="AgriAI"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
            <div>
              <h2
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  color: 'var(--color-green-dark)',
                  margin: 0,
                  letterSpacing: '-0.02em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <span>⚙️</span>
                <span>{t.settings?.modalTitle || 'Settings'}</span>
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              border: '1px solid #e2e8f0',
              background: '#f8fafc',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '1.1rem',
              fontWeight: 700,
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#fee2e2';
              e.currentTarget.style.color = '#dc2626';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f8fafc';
              e.currentTarget.style.color = '#64748b';
            }}
          >
            ✕
          </button>
        </div>

        {/* ============================================================ */}
        {/* A. PREFERENCES: LANGUAGE                                    */}
        {/* ============================================================ */}
        <section style={{ marginBottom: '1.75rem' }}>
          <div style={{ marginBottom: '0.75rem' }}>
            <h3
              style={{
                fontSize: '0.98rem',
                fontWeight: 700,
                color: 'var(--color-green-dark)',
                margin: '0 0 0.25rem 0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem'
              }}
            >
              <span>🌐</span>
              <span>{t.settings?.languageTitle || 'Language'}</span>
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
              {t.settings?.languageDesc || 'Choose your preferred display language'}
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.65rem'
            }}
          >
            {[
              { code: 'en', label: 'English', sub: 'English' },
              { code: 'kn', label: 'ಕನ್ನಡ', sub: 'Kannada' },
              { code: 'hi', label: 'हिंदी', sub: 'Hindi' }
            ].map((lang) => {
              const isSelected = language === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleLanguageChange(lang.code)}
                  style={{
                    padding: '0.75rem 0.5rem',
                    borderRadius: '14px',
                    border: isSelected ? '2px solid var(--color-green-main)' : '1px solid #cbd5e1',
                    background: isSelected ? 'var(--color-green-subtle)' : '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '2px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.96rem',
                      fontWeight: 700,
                      color: isSelected ? 'var(--color-green-dark)' : '#1e293b'
                    }}
                  >
                    {lang.label}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    {lang.sub}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ============================================================ */}
        {/* B. WEATHER MODE (Online / Offline)                          */}
        {/* ============================================================ */}
        <section style={{ marginBottom: '1.75rem' }}>
          <div style={{ marginBottom: '0.75rem' }}>
            <h3
              style={{
                fontSize: '0.98rem',
                fontWeight: 700,
                color: 'var(--color-green-dark)',
                margin: '0 0 0.25rem 0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem'
              }}
            >
              <span>🌦️</span>
              <span>{t.settings?.weatherModeTitle || 'Weather Mode'}</span>
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
              {t.settings?.weatherModeDesc || 'Control live weather data requests'}
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.75rem'
            }}
          >
            {/* Online Mode Option */}
            <button
              type="button"
              onClick={() => handleWeatherModeChange('online')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '1rem',
                borderRadius: '16px',
                border: weatherMode === 'online'
                  ? '2px solid var(--color-green-main)'
                  : '1.5px solid #e2e8f0',
                background: weatherMode === 'online'
                  ? 'var(--color-green-subtle)'
                  : '#ffffff',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '1.1rem' }}>🌦️</span>
                {weatherMode === 'online' && (
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      background: 'var(--color-green-dark)',
                      color: '#ffffff',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      textTransform: 'uppercase'
                    }}
                  >
                    {t.settings?.currentModeBadge || 'Active'}
                  </span>
                )}
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--color-green-dark)', marginBottom: '0.2rem' }}>
                Online
              </div>
              <div style={{ fontSize: '0.74rem', color: '#475569', lineHeight: 1.35 }}>
                {t.settings?.onlineModeDesc || 'Retrieve real-time live weather data for your area.'}
              </div>
            </button>

            {/* Offline Mode Option */}
            <button
              type="button"
              onClick={() => handleWeatherModeChange('offline')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '1rem',
                borderRadius: '16px',
                border: weatherMode === 'offline'
                  ? '2px solid #334155'
                  : '1.5px solid #e2e8f0',
                background: weatherMode === 'offline'
                  ? '#f1f5f9'
                  : '#ffffff',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '1.1rem' }}>⚫</span>
                {weatherMode === 'offline' && (
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      background: '#334155',
                      color: '#ffffff',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      textTransform: 'uppercase'
                    }}
                  >
                    {t.settings?.currentModeBadge || 'Active'}
                  </span>
                )}
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1e293b', marginBottom: '0.2rem' }}>
                Offline
              </div>
              <div style={{ fontSize: '0.74rem', color: '#475569', lineHeight: 1.35 }}>
                {t.settings?.offlineModeDesc || 'Do not request live weather. Local AI/ML features continue working.'}
              </div>
            </button>
          </div>
        </section>

        {/* ============================================================ */}
        {/* C. ACCOUNT (My Profile & Logout)                            */}
        {/* ============================================================ */}
        <section
          style={{
            padding: '1.15rem',
            borderRadius: '18px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            flexWrap: 'wrap'
          }}
        >
          <div>
            <div
              style={{
                fontSize: '0.76rem',
                textTransform: 'uppercase',
                fontWeight: 700,
                color: '#64748b',
                letterSpacing: '0.04em'
              }}
            >
              {t.settings?.loggedInAs || 'Logged in as'}
            </div>
            <div
              style={{
                fontSize: '1rem',
                fontWeight: 800,
                color: 'var(--color-green-dark)',
                marginTop: '2px'
              }}
            >
              {user?.name || 'Farmer'}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {onOpenProfile && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenProfile();
                }}
                style={{
                  padding: '0.5rem 0.95rem',
                  borderRadius: 'var(--radius-full)',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  color: '#1e293b',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  transition: 'all 0.18s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--color-green-subtle)';
                  e.currentTarget.style.borderColor = 'var(--color-green-main)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#ffffff';
                  e.currentTarget.style.borderColor = '#cbd5e1';
                }}
              >
                <span>👤</span>
                <span>{t.myProfile?.modalTitle || 'My Profile'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onClose();
                if (onLogout) onLogout();
              }}
              style={{
                padding: '0.5rem 0.95rem',
                borderRadius: 'var(--radius-full)',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                transition: 'all 0.18s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#fee2e2';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#fef2f2';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <span>🚪</span>
              <span>{t.settings?.logoutBtn || 'Logout'}</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
