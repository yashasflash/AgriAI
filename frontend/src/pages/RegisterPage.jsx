import React, { useState } from 'react';
import { useTranslation } from '../i18n';
import LanguageSelector from '../components/LanguageSelector';
import { registerUser } from '../services/api';
import assetPath from '../utils/assetPath';

export default function RegisterPage({ onLogin, onNavigate, onBack }) {
  const { language, setLanguage, t } = useTranslation();

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [prefLang, setPrefLang] = useState(language || 'en');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !password) return;

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await registerUser({
        name: name.trim(),
        password: password,
        language: prefLang,
      });

      if (prefLang) {
        setLanguage(prefLang);
      }

      onLogin(res.user);
    } catch (err) {
      console.warn('Registration error:', err);
      const rawMsg = err.message || '';
      const status = err.status;
      const isNetwork =
        err.isNetworkError ||
        rawMsg.toLowerCase().includes('failed to fetch') ||
        rawMsg.toLowerCase().includes('network') ||
        rawMsg.toLowerCase().includes('refused');

      if (isNetwork) {
        setErrorMsg('AgriAI backend is not reachable. Please ensure the backend service is running.');
      } else if (
        status === 400 ||
        rawMsg.toLowerCase().includes('already exists') ||
        rawMsg.toLowerCase().includes('duplicate') ||
        rawMsg.toLowerCase().includes('unique')
      ) {
        setErrorMsg(t.auth?.errorExists || 'An account with this name already exists.');
      } else {
        setErrorMsg(err.detail || rawMsg || 'Registration failed. Please try another name.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem',
        backgroundImage: `url('${assetPath("/images/login-bg.jpg")}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        overflow: 'hidden'
      }}
    >
      {/* Dark Agricultural Green Overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, rgba(9, 23, 14, 0.88) 0%, rgba(15, 56, 30, 0.92) 100%)',
          zIndex: 1
        }}
      />

      {/* Top Navigation Controls */}
      <div
        style={{
          position: 'absolute',
          top: '1.5rem',
          left: '1.5rem',
          right: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 10
        }}
      >
        <button
          type="button"
          onClick={onBack}
          style={{
            background: 'rgba(255, 255, 255, 0.12)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            padding: '0.45rem 1rem',
            borderRadius: 'var(--radius-full)',
            color: '#ffffff',
            fontSize: '0.86rem',
            fontWeight: 600,
            backdropFilter: 'blur(8px)'
          }}
        >
          {t.auth.backToHome}
        </button>

        <LanguageSelector variant="dark" />
      </div>

      {/* Glass Card Container */}
      <div
        className="glass-dark animate-fade-up"
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: '460px',
          borderRadius: 'var(--radius-xl)',
          padding: '2.25rem',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
          color: '#ffffff'
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #166534, #22c55e)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              marginBottom: '0.75rem',
              boxShadow: '0 4px 14px rgba(34, 197, 94, 0.3)'
            }}
          >
            🌱
          </div>
          <h1 className="font-serif" style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.3rem' }}>
            {t.auth.registerTitle}
          </h1>
          <p style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>
            {t.auth.registerSubtitle}
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              color: '#fecaca',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.86rem',
              marginBottom: '1.25rem',
              textAlign: 'center'
            }}
          >
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '0.3rem' }}>
              {t.auth.nameLabel}
            </label>
            <input
              type="text"
              placeholder={t.auth.namePlaceholder}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.7rem 1rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#ffffff',
                fontSize: '0.92rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '0.3rem' }}>
              {t.auth.languageLabel}
            </label>
            <select
              value={prefLang}
              onChange={(e) => setPrefLang(e.target.value)}
              style={{
                width: '100%',
                padding: '0.7rem 1rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: '#0f381e',
                color: '#ffffff',
                fontSize: '0.92rem'
              }}
            >
              <option value="en">English</option>
              <option value="kn">ಕನ್ನಡ (Kannada)</option>
              <option value="hi">हिंदी (Hindi)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '0.3rem' }}>
              {t.auth.passwordLabel}
            </label>
            <input
              type="password"
              placeholder={t.auth.passwordPlaceholder}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.7rem 1rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#ffffff',
                fontSize: '0.92rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '0.3rem' }}>
              {t.auth.confirmPasswordLabel}
            </label>
            <input
              type="password"
              placeholder={t.auth.confirmPasswordPlaceholder}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.7rem 1rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#ffffff',
                fontSize: '0.92rem'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '0.5rem',
              padding: '0.85rem',
              borderRadius: 'var(--radius-full)',
              background: 'linear-gradient(135deg, #a3e635, #22c55e)',
              border: 'none',
              color: '#09170e',
              fontSize: '1rem',
              fontWeight: 800,
              boxShadow: '0 4px 16px rgba(163, 230, 53, 0.35)',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Creating...' : t.auth.registerBtn}
          </button>
        </form>

        {/* Switch to Login */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255, 255, 255, 0.12)' }}>
          <span style={{ fontSize: '0.88rem', color: '#cbd5e1' }}>
            {t.auth.hasAccount}{' '}
          </span>
          <button
            type="button"
            onClick={() => onNavigate('login')}
            style={{
              color: '#a3e635',
              fontWeight: 700,
              fontSize: '0.88rem',
              textDecoration: 'underline'
            }}
          >
            {t.auth.signIn}
          </button>
        </div>

        {/* Local storage note */}
        <div style={{ marginTop: '1.25rem', fontSize: '0.74rem', color: '#94a3b8', textAlign: 'center' }}>
          {t.auth.localNotice}
        </div>
      </div>
    </div>
  );
}
