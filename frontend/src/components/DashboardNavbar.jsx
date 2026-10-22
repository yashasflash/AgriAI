import React, { useState } from 'react';
import { useTranslation } from '../i18n';
import { getOrAssignUserAvatar } from '../services/avatar';

export default function DashboardNavbar({
  user,
  activeTab = 'chat',
  onTabChange,
  onOpenProfile,
  onOpenSettings,
  onLogout
}) {
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const avatar = getOrAssignUserAvatar(user);

  const tabs = [
    { id: 'chat', label: t.dashboard?.tabChat || 'AI Assistant', icon: '💬' },
    { id: 'crop', label: t.dashboard?.tabCrop || 'Crop Advisory', icon: '🌱' },
    { id: 'leaf', label: t.dashboard?.tabLeaf || 'Leaf Health', icon: '🍃' }
  ];

  return (
    <header
      id="dashboard-navbar-header"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 950,
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        padding: '0.65rem 1.25rem',
        pointerEvents: 'none'
      }}
    >
      {/* Floating Pill Glass Navbar for Dashboard */}
      <div
        className="floating-navbar-pill dashboard-nav-container"
        style={{
          pointerEvents: 'auto',
          width: '100%',
          maxWidth: '1280px',
          background: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(22, 101, 52, 0.14)',
          borderRadius: '24px',
          padding: '0.5rem 1.25rem',
          boxShadow: '0 10px 30px -4px rgba(15, 56, 30, 0.08), 0 2px 8px -2px rgba(15, 56, 30, 0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Left: Brand Identity */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.7rem',
            userSelect: 'none'
          }}
        >
          <div
            className="brand-icon-box"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: '#ffffff',
              border: '1px solid rgba(22, 101, 52, 0.16)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(15, 56, 30, 0.12)',
              flexShrink: 0,
              overflow: 'hidden',
              padding: '2px'
            }}
          >
            <img
              src="/images/agriai-emblem-transparent.png"
              alt="AgriAI Emblem"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain'
              }}
            />
          </div>
          <div>
            <div
              style={{
                fontWeight: 900,
                fontSize: '1.2rem',
                color: 'var(--color-green-dark)',
                letterSpacing: '-0.025em',
                lineHeight: 1.1
              }}
            >
              AgriAI
            </div>
            <div
              style={{
                fontSize: '0.7rem',
                color: '#64748b',
                fontWeight: 600,
                letterSpacing: '0.01em'
              }}
            >
              Offline AI Platform
            </div>
          </div>
        </div>

        {/* Center: Dashboard Application Tabs */}
        <nav
          className="desktop-dashboard-tabs"
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(241, 245, 249, 0.75)',
            padding: '4px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid #e2e8f0',
            gap: '3px'
          }}
        >
          {tabs.map((tab) => {
            const isCurrent = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.38rem 1.05rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.85rem',
                  fontWeight: isCurrent ? 800 : 600,
                  color: isCurrent ? '#166534' : '#475569',
                  background: isCurrent ? '#eaf3e6' : 'transparent',
                  boxShadow: isCurrent ? '0 2px 6px rgba(22, 101, 52, 0.12)' : 'none',
                  border: isCurrent ? '1px solid #c7e1be' : '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => {
                  if (!isCurrent) {
                    e.currentTarget.style.color = '#166534';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isCurrent) {
                    e.currentTarget.style.color = '#475569';
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <span style={{ fontSize: '0.95rem' }}>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: User Profile + Settings + Logout (Language is exclusively inside Settings) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          {/* 👤 My Profile Button */}
          <button
            type="button"
            onClick={onOpenProfile}
            title={t.myProfile?.modalTitle || 'My Profile'}
            className="dashboard-user-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.38rem 0.9rem',
              borderRadius: 'var(--radius-full)',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              color: '#1e293b',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.borderColor = '#86efac';
              e.currentTarget.style.background = '#f0fdf4';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.background = '#ffffff';
            }}
          >
            <span style={{ fontSize: '1.05rem' }}>{avatar.emoji || '👤'}</span>
            <span className="user-name-display" style={{ textTransform: 'capitalize' }}>
              {user?.name || 'Ramesh'}
            </span>
            <span style={{ fontSize: '0.72rem', color: '#64748b', marginLeft: '1px' }}>⌵</span>
          </button>

          {/* ⚙️ Settings Button */}
          <button
            type="button"
            onClick={onOpenSettings}
            title={t.settings?.modalTitle || 'Settings'}
            className="dashboard-settings-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.38rem 0.85rem',
              borderRadius: 'var(--radius-full)',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              color: '#334155',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f8fafc';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.transform = 'none';
            }}
          >
            <span>⚙️</span>
            <span className="desktop-settings-text">{t.settings?.modalTitle?.split(' ')[0] || 'Settings'}</span>
          </button>

          {/* 🚪 Logout Button */}
          <button
            type="button"
            onClick={onLogout}
            title={t.nav?.logout || 'Logout'}
            className="dashboard-logout-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.38rem 0.85rem',
              borderRadius: 'var(--radius-full)',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 3px rgba(220, 38, 38, 0.05)'
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
            <span>[→</span>
            <span>{t.nav?.logout || 'Logout'}</span>
          </button>

          {/* Mobile Hamburger for Dashboard Tabs */}
          <button
            type="button"
            className="mobile-hamburger-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Dashboard Menu"
            aria-expanded={mobileMenuOpen}
            style={{
              display: 'none',
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(15, 56, 30, 0.06)',
              border: '1px solid rgba(15, 56, 30, 0.1)',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              position: 'relative',
              padding: '8px'
            }}
          >
            <div
              style={{
                width: '18px',
                height: '14px',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <span
                style={{
                  width: '100%',
                  height: '2px',
                  background: 'var(--color-green-dark)',
                  borderRadius: '2px',
                  transition: 'all 0.3s ease',
                  transformOrigin: 'left center',
                  transform: mobileMenuOpen ? 'rotate(45deg) translate(0px, -1px)' : 'none'
                }}
              />
              <span
                style={{
                  width: '100%',
                  height: '2px',
                  background: 'var(--color-green-dark)',
                  borderRadius: '2px',
                  transition: 'all 0.2s ease',
                  opacity: mobileMenuOpen ? 0 : 1
                }}
              />
              <span
                style={{
                  width: '100%',
                  height: '2px',
                  background: 'var(--color-green-dark)',
                  borderRadius: '2px',
                  transition: 'all 0.3s ease',
                  transformOrigin: 'left center',
                  transform: mobileMenuOpen ? 'rotate(-45deg) translate(0px, 1px)' : 'none'
                }}
              />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Slide-Down Drawer for Dashboard */}
      {mobileMenuOpen && (
        <div
          className="mobile-drawer-menu"
          style={{
            pointerEvents: 'auto',
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: '1rem',
            right: '1rem',
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(22, 101, 52, 0.15)',
            borderRadius: '20px',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem',
            boxShadow: '0 20px 40px -10px rgba(15, 56, 30, 0.18)',
            animation: 'dropdownScale 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {tabs.map((tab) => {
              const isCurrent = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    onTabChange(tab.id);
                    setMobileMenuOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    textAlign: 'left',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    fontSize: '0.94rem',
                    fontWeight: isCurrent ? 800 : 600,
                    color: isCurrent ? 'var(--color-green-dark)' : '#334155',
                    background: isCurrent ? 'var(--color-green-subtle)' : 'transparent',
                    border: isCurrent ? '1px solid var(--border-green)' : '1px solid transparent'
                  }}
                >
                  <span style={{ fontSize: '1.1rem' }}>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(15, 56, 30, 0.08)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenProfile();
                }}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  padding: '0.7rem',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--color-green-subtle)',
                  color: 'var(--color-green-dark)',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  border: '1px solid var(--border-green)'
                }}
              >
                <span>{avatar.emoji}</span>
                <span>{t.myProfile?.modalTitle || 'My Profile'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onOpenSettings) onOpenSettings();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem',
                  padding: '0.7rem 1.1rem',
                  borderRadius: 'var(--radius-full)',
                  background: '#f8fafc',
                  color: '#334155',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  border: '1px solid #cbd5e1'
                }}
              >
                <span>⚙️</span>
                <span>{t.settings?.modalTitle?.split(' ')[0] || 'Settings'}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onLogout();
              }}
              style={{
                width: '100%',
                padding: '0.7rem 1.25rem',
                borderRadius: 'var(--radius-full)',
                background: '#fef2f2',
                color: '#dc2626',
                fontWeight: 700,
                fontSize: '0.88rem',
                border: '1px solid #fee2e2'
              }}
            >
              {t.nav?.logout || 'Logout'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

