import React, { useState } from 'react';
import { useTranslation } from '../i18n';
import LanguageSelector from '../components/LanguageSelector';
import { loginUser, registerUser } from '../services/api';
import assetPath from '../utils/assetPath';

export default function LoginPage({ onLogin, onBack, initialMode = 'login' }) {
  const { language, setLanguage, t } = useTranslation();

  const [mode, setMode] = useState(initialMode); // 'login' | 'register'
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [prefLang, setPrefLang] = useState(language || 'en');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isRegister = mode === 'register';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !password) {
      setErrorMsg(t.auth?.errorEmpty || 'Name and password cannot be empty.');
      return;
    }

    if (isRegister && password !== confirmPassword) {
      setErrorMsg(t.auth?.errorMismatch || 'Passwords do not match.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      if (isRegister) {
        const res = await registerUser({
          name: name.trim(),
          password: password,
          language: prefLang,
        });
        if (prefLang && setLanguage) {
          setLanguage(prefLang);
        }
        onLogin(res.user);
      } else {
        const res = await loginUser({
          name: name.trim(),
          password: password,
        });
        if (res.user?.language && setLanguage) {
          setLanguage(res.user.language);
        }
        onLogin(res.user);
      }
    } catch (err) {
      console.warn('Auth error:', err);
      const rawMsg = err.message || '';
      const status = err.status;
      const isNetwork =
        err.isNetworkError ||
        rawMsg.toLowerCase().includes('failed to fetch') ||
        rawMsg.toLowerCase().includes('network') ||
        rawMsg.toLowerCase().includes('refused') ||
        rawMsg.toLowerCase().includes('unavailable');

      if (
        status === 401 ||
        (!isRegister && (rawMsg.toLowerCase().includes('incorrect') || rawMsg.toLowerCase().includes('password')))
      ) {
        setErrorMsg(t.auth?.errorInvalidCreds || 'Name or password is incorrect.');
      } else if (
        status === 400 ||
        rawMsg.toLowerCase().includes('already exists') ||
        rawMsg.toLowerCase().includes('duplicate') ||
        rawMsg.toLowerCase().includes('unique')
      ) {
        setErrorMsg(t.auth?.errorExists || 'An account with this name already exists.');
      } else if (isNetwork) {
        setErrorMsg('AgriAI backend is not reachable. Please ensure the backend service is running.');
      } else {
        setErrorMsg(
          err.detail ||
          rawMsg ||
          (isRegister
            ? (t.auth?.errorExists || 'Registration failed. Please try another name.')
            : (t.auth?.errorInvalidCreds || 'Name or password is incorrect.'))
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setErrorMsg('');
    setPassword('');
    setConfirmPassword('');
    setMode(isRegister ? 'login' : 'register');
  };

  return (
    <div className="login-page">
      {/* ================================================================ */}
      {/* LEFT — Agricultural Visual + AgriAI Branding (50%)              */}
      {/* ================================================================ */}
      <div className="login-left">
        {/* Background farm image */}
        <div className="login-left-bg" aria-hidden="true" />
        {/* Dark green gradient overlay */}
        <div className="login-left-overlay" aria-hidden="true" />

        {/* Floating leaf silhouettes */}
        <div className="login-leaf login-leaf--1" aria-hidden="true">
          <img src={assetPath("/images/real-leaf-1.png")} alt="" />
        </div>
        <div className="login-leaf login-leaf--2" aria-hidden="true">
          <img src={assetPath("/images/real-leaf-3.png")} alt="" />
        </div>

        {/* Content layer */}
        <div className="login-left-content">
          {/* Logo — approx 160px wide, natural aspect ratio */}
          <div className="login-left-logo">
            <img
              src={assetPath("/images/agriai-logo-full-transparent.png")}
              alt="AgriAI"
            />
          </div>

          {/* Main quote block */}
          <div className="login-left-hero">
            <h1 className="login-quote">
              {t.auth?.leftSlogan || (
                <>Smart Farming.<br /><span className="login-quote-accent">Smarter Decisions.</span></>
              )}
            </h1>

            <p className="login-tagline">
              {t.auth?.leftSupporting || 'AI-powered farming guidance for better everyday decisions.'}
            </p>

            <p className="login-description">
              Understand your crops, check plant health, and make informed farming decisions with AgriAI.
            </p>

            {/* 3 Feature pills */}
            <div className="login-pills">
              <span className="login-pill">🌱 Better Crops</span>
              <span className="login-pill">🍃 Healthier Plants</span>
              <span className="login-pill">🤖 Smarter Farming</span>
            </div>
          </div>

          {/* Footer */}
          <div className="login-left-footer">
            <span>© 2026 AgriAI</span>
            <span className="login-left-footer-badge">
              <span className="login-privacy-dot" />
              Local &amp; Private
            </span>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* RIGHT — Login / Register Form (50%)                             */}
      {/* ================================================================ */}
      <div className="login-right">
        {/* Top floating controls */}
        <div className="login-right-topbar">
          <button type="button" onClick={onBack} className="login-back-pill">
            ← {t.auth?.backBtn || 'Back to Homepage'}
          </button>
          <LanguageSelector variant="default" />
        </div>

        {/* Centered card */}
        <div className="login-card">
          {/* Emblem + heading */}
          <div className="login-card-header">
            <div className="login-emblem-box">
              <img
                src={assetPath("/images/agriai-emblem-transparent.png")}
                alt="AgriAI"
              />
            </div>
            <h2 className="login-card-title">
              {isRegister
                ? (t.auth?.registerTitle || 'Create your AgriAI account')
                : (t.auth?.welcomeTitle || 'Welcome to AgriAI')}
            </h2>
            <p className="login-card-subtitle">
              {isRegister
                ? (t.auth?.registerSubtitle || 'Start your private offline farming intelligence journey.')
                : (t.auth?.welcomeSubtitle || 'Your farming assistant is ready.')}
            </p>
          </div>

          {/* Error */}
          {errorMsg && (
            <div className="login-error">
              <span>⚠</span> {errorMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="login-form">
            {/* Name */}
            <div className="login-field">
              <label htmlFor="auth-name-input">{t.auth?.nameLabel || 'Name'}</label>
              <input
                id="auth-name-input"
                type="text"
                placeholder={t.auth?.namePlaceholder || 'Enter your name'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {/* Language (register only) */}
            {isRegister && (
              <div className="login-field">
                <label htmlFor="auth-lang-select">{t.auth?.languageLabel || 'Preferred Language'}</label>
                <select
                  id="auth-lang-select"
                  value={prefLang}
                  onChange={(e) => setPrefLang(e.target.value)}
                  disabled={loading}
                >
                  <option value="en">English</option>
                  <option value="kn">ಕನ್ನಡ (Kannada)</option>
                  <option value="hi">हिंदी (Hindi)</option>
                </select>
              </div>
            )}

            {/* Password */}
            <div className="login-field">
              <label htmlFor="auth-password-input">{t.auth?.passwordLabel || 'Password'}</label>
              <div className="login-field-password">
                <input
                  id="auth-password-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t.auth?.passwordPlaceholder || 'Enter your password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="login-show-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* Confirm password (register only) */}
            {isRegister && (
              <div className="login-field">
                <label htmlFor="auth-confirm-password-input">{t.auth?.confirmPasswordLabel || 'Confirm Password'}</label>
                <div className="login-field-password">
                  <input
                    id="auth-confirm-password-input"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder={t.auth?.confirmPasswordPlaceholder || 'Re-enter password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="login-show-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading} className="login-submit">
              {loading
                ? (isRegister ? (t.auth?.creatingAccount || 'Creating account...') : (t.auth?.signingIn || 'Signing in...'))
                : (isRegister ? (t.auth?.registerBtn || 'Create Account →') : (t.auth?.loginBtn || 'Continue to AgriAI →'))}
            </button>
          </form>

          {/* Mode toggle */}
          <div className="login-toggle-row">
            <span>
              {isRegister
                ? (t.auth?.hasAccount || 'Already have an account?')
                : (t.auth?.noAccount || "Don't have an account?")}
            </span>
            <button type="button" onClick={toggleMode} className="login-toggle-link">
              {isRegister ? (t.auth?.loginLink || 'Sign In') : (t.auth?.createAccountLink || 'Create Account')}
            </button>
          </div>
        </div>

        {/* Bottom privacy note */}
        <p className="login-right-privacy">
          {t.auth?.localNotice || 'Your account stays private on your device.'}
        </p>
      </div>
    </div>
  );
}
