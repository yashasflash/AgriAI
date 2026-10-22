import React, { useEffect, useRef } from 'react';
import { useTranslation } from '../i18n';
import { getOrAssignUserAvatar } from '../services/avatar';

export default function MyProfileModal({ isOpen, onClose, user, onLogout }) {
  const { t } = useTranslation();
  const modalContentRef = useRef(null);

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

  // Retrieve or assign persistent avatar from predefined set
  const avatar = getOrAssignUserAvatar(user);

  let memberSince = 'Local SQLite Account';
  try {
    if (user?.created_at) {
      memberSince = new Date(user.created_at).toLocaleDateString([], {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  } catch {
    memberSince = 'Local SQLite Account';
  }

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
          maxWidth: '460px',
          background: '#ffffff',
          borderRadius: '26px',
          border: '1px solid rgba(22, 101, 52, 0.15)',
          padding: '2.25rem 2rem',
          boxShadow: '0 20px 48px -10px rgba(15, 56, 30, 0.22)',
          animation: 'fadeUp 0.25s ease-out',
          position: 'relative'
        }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close profile"
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
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

        {/* Profile Header Badge */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          {/* Avatar Icon Display */}
          <div
            style={{
              width: '88px',
              height: '88px',
              borderRadius: '50%',
              background: avatar.bg,
              border: `3px solid ${avatar.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '3rem',
              margin: '0 auto 1rem auto',
              boxShadow: '0 8px 24px rgba(15, 56, 30, 0.12)',
              position: 'relative'
            }}
          >
            <span>{avatar.emoji}</span>
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.25rem 0.85rem',
              borderRadius: 'var(--radius-full)',
              background: '#f0fdf4',
              border: '1px solid var(--border-green)',
              color: 'var(--color-green-dark)',
              fontSize: '0.78rem',
              fontWeight: 800,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginBottom: '0.5rem'
            }}
          >
            <img
              src="/images/agriai-emblem-transparent.png"
              alt="AgriAI"
              style={{ width: '16px', height: '16px', objectFit: 'contain' }}
            />
            <span>{t.myProfile?.modalTitle || 'My Profile'}</span>
          </div>

          {/* User Name */}
          <h2
            style={{
              fontSize: '1.65rem',
              fontWeight: 800,
              color: 'var(--color-green-dark)',
              margin: '0.2rem 0 0.25rem 0',
              letterSpacing: '-0.02em'
            }}
          >
            {user?.name || 'Farmer'}
          </h2>

          <div
            style={{
              fontSize: '0.86rem',
              color: '#64748b',
              fontWeight: 600
            }}
          >
            {avatar.title || 'AgriAI Farmer'}
          </div>
        </div>

        {/* Profile Details List */}
        <div
          style={{
            background: '#f8fafc',
            borderRadius: '20px',
            border: '1px solid #e2e8f0',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.95rem',
            marginBottom: '1.5rem'
          }}
        >
          {/* Name Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '0.75rem',
              borderBottom: '1px solid #e2e8f0'
            }}
          >
            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
              {t.myProfile?.nameLabel || 'Name'}
            </span>
            <span style={{ fontSize: '0.92rem', color: 'var(--color-green-dark)', fontWeight: 800 }}>
              {user?.name || 'Farmer'}
            </span>
          </div>

          {/* Assigned Avatar Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '0.75rem',
              borderBottom: '1px solid #e2e8f0'
            }}
          >
            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
              {t.myProfile?.avatarLabel || 'Avatar'}
            </span>
            <span
              style={{
                fontSize: '0.88rem',
                color: '#1e293b',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <span>{avatar.emoji}</span>
              <span>{avatar.label}</span>
            </span>
          </div>

          {/* Account Status Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '0.75rem',
              borderBottom: '1px solid #e2e8f0'
            }}
          >
            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
              {t.myProfile?.statusLabel || 'Account Status'}
            </span>
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                color: '#166534',
                background: '#dcfce7',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)'
              }}
            >
              ● {t.myProfile?.localAccount || 'Local SQLite Account'}
            </span>
          </div>

          {/* Member Since Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
              {t.myProfile?.memberSince || 'Member Since'}
            </span>
            <span style={{ fontSize: '0.85rem', color: '#334155', fontWeight: 600 }}>
              {memberSince}
            </span>
          </div>
        </div>

        {/* Footer Action */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: '100%',
              padding: '0.75rem 1.5rem',
              borderRadius: 'var(--radius-full)',
              background: 'linear-gradient(135deg, #0f381e, #166534)',
              color: '#ffffff',
              fontSize: '0.92rem',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(15, 56, 30, 0.2)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 18px rgba(15, 56, 30, 0.28)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(15, 56, 30, 0.2)';
            }}
          >
            {t.myProfile?.closeBtn || 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
