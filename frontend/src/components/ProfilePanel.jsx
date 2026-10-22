import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../i18n';
import { updateProfile } from '../services/api';

export default function ProfilePanel({ isOpen, onClose, user, onUserUpdated, onLogout }) {
  const { language, setLanguage, t } = useTranslation();
  const modalContentRef = useRef(null);

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [prefLang, setPrefLang] = useState(user?.language || language || 'en');
  const [currPassword, setCurrPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

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

  let createdDate = 'Local SQLite Account';
  try {
    if (user?.created_at) {
      createdDate = new Date(user.created_at).toLocaleDateString([], {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  } catch {
    createdDate = 'Local Account';
  }

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (newPassword && newPassword !== confirmPassword) {
      setErrorMsg('New passwords do not match');
      return;
    }

    if (newPassword && !currPassword) {
      setErrorMsg('Current password is required to change password');
      return;
    }

    setLoading(true);

    try {
      const updated = await updateProfile({
        name: name.trim() || undefined,
        language: prefLang,
        current_password: currPassword || undefined,
        new_password: newPassword || undefined,
      });

      // Update global language immediately
      if (prefLang && prefLang !== language) {
        setLanguage(prefLang);
      }

      onUserUpdated(updated);
      setSuccessMsg(t.profile?.successMsg || 'Profile updated successfully!');
      setIsEditing(false);
      setCurrPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.warn('Profile update error:', err);
      setErrorMsg(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLanguageChange = async (langCode) => {
    setPrefLang(langCode);
    setLanguage(langCode);
    try {
      const updated = await updateProfile({ language: langCode });
      onUserUpdated(updated);
      setSuccessMsg(t.profile?.successMsg || 'Language updated successfully!');
      setTimeout(() => setSuccessMsg(''), 2500);
    } catch (err) {
      console.warn('Quick lang update error:', err);
    }
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
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div
        ref={modalContentRef}
        style={{
          width: '100%',
          maxWidth: '480px',
          background: '#ffffff',
          borderRadius: '26px',
          border: '1px solid rgba(22, 101, 52, 0.15)',
          padding: '2rem',
          boxShadow: '0 20px 48px -10px rgba(15, 56, 30, 0.22)',
          animation: 'fadeUp 0.25s ease-out',
          position: 'relative'
        }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: '#f1f5f9',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.9rem',
            color: '#64748b',
            cursor: 'pointer',
            transition: 'background 0.2s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
        >
          ✕
        </button>

        {/* Profile Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #0f381e, #166534)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.6rem',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(15, 56, 30, 0.22)',
              flexShrink: 0
            }}
          >
            🌾
          </div>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-green-dark)', lineHeight: 1.2 }}>
              {t.profile?.modalTitle || 'Profile'}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#16a34a', fontWeight: 700, marginTop: '0.2rem' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e' }} />
              <span>{t.profile?.statusLocal || '● Local Account'}</span>
            </div>
          </div>
        </div>

        {/* Status Alerts */}
        {errorMsg && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '0.75rem', borderRadius: '12px', fontSize: '0.86rem', marginBottom: '1.25rem' }}>
            ⚠️ {errorMsg}
          </div>
        )}
        {successMsg && (
          <div style={{ background: '#f0fdf4', border: '1px solid var(--border-green)', color: '#166534', padding: '0.75rem', borderRadius: '12px', fontSize: '0.86rem', marginBottom: '1.25rem' }}>
            ✓ {successMsg}
          </div>
        )}

        {/* Profile View Mode */}
        {!isEditing ? (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.75rem' }}>
              {/* Name */}
              <div style={{ background: '#f8fafc', padding: '0.9rem 1.15rem', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--color-green-main)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                    {t.profile?.name || 'Name'}
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1e293b' }}>
                    {user?.name || 'Farmer'}
                  </div>
                </div>
                <span style={{ fontSize: '1.2rem' }}>👤</span>
              </div>

              {/* Preferred Language */}
              <div style={{ background: '#f8fafc', padding: '0.9rem 1.15rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--color-green-main)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    {t.profile?.preferredLang || 'Preferred Language'}
                  </div>
                  <span style={{ fontSize: '1.1rem' }}>🌐</span>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {[
                    { code: 'en', label: 'English' },
                    { code: 'kn', label: 'ಕನ್ನಡ' },
                    { code: 'hi', label: 'हिंदी' }
                  ].map((lang) => {
                    const isSelected = (user?.language || language) === lang.code;
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => handleQuickLanguageChange(lang.code)}
                        style={{
                          flex: 1,
                          padding: '0.42rem 0.65rem',
                          borderRadius: '10px',
                          fontSize: '0.82rem',
                          fontWeight: isSelected ? 800 : 600,
                          background: isSelected ? 'var(--color-green-dark)' : '#ffffff',
                          color: isSelected ? '#ffffff' : '#334155',
                          border: isSelected ? '1px solid var(--color-green-dark)' : '1px solid #cbd5e1',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {lang.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Account Created Date */}
              <div style={{ background: '#f8fafc', padding: '0.9rem 1.15rem', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--color-green-main)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                    {t.profile?.created || 'Account Created'}
                  </div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#334155' }}>
                    {createdDate}
                  </div>
                </div>
                <span style={{ fontSize: '1.2rem' }}>📅</span>
              </div>
            </div>

            {/* Actions: Edit & Logout */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-full)',
                  background: 'linear-gradient(135deg, #0f381e, #166534)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(15, 56, 30, 0.2)',
                  cursor: 'pointer'
                }}
              >
                ✏️ {t.profile?.editBtn || 'Edit Profile'}
              </button>
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                style={{
                  padding: '0.75rem 1.25rem',
                  borderRadius: 'var(--radius-full)',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                {t.nav?.logout || 'Logout'}
              </button>
            </div>
          </div>
        ) : (
          /* Edit Mode Form */
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: '0.3rem' }}>
                {t.profile?.name || 'Name'}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.92rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: '0.3rem' }}>
                {t.profile?.preferredLang || 'Preferred Language'}
              </label>
              <select
                value={prefLang}
                onChange={(e) => setPrefLang(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.92rem'
                }}
              >
                <option value="en">English</option>
                <option value="kn">ಕನ್ನಡ (Kannada)</option>
                <option value="hi">हिंदी (Hindi)</option>
              </select>
            </div>

            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-green-dark)', marginBottom: '0.5rem' }}>
                {t.profile?.changePasswordTitle || 'Change Password (Optional)'}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <input
                  type="password"
                  placeholder={t.profile?.currPassword || 'Current Password'}
                  value={currPassword}
                  onChange={(e) => setCurrPassword(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.86rem' }}
                />
                <input
                  type="password"
                  placeholder={t.profile?.newPassword || 'New Password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.86rem' }}
                />
                <input
                  type="password"
                  placeholder={t.profile?.confirmNewPassword || 'Confirm New Password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.86rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-full)',
                  background: 'linear-gradient(135deg, #0f381e, #166534)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Saving...' : (t.profile?.saveBtn || 'Save Changes')}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                style={{
                  padding: '0.75rem 1.25rem',
                  borderRadius: 'var(--radius-full)',
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  color: '#475569',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                {t.profile?.cancelBtn || 'Cancel'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
