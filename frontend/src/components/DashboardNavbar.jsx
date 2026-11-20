import React, { useState } from 'react';
import { useTranslation } from '../i18n';
import { getOrAssignUserAvatar } from '../services/avatar';
import assetPath from '../utils/assetPath';

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
    { id: 'leaf', label: t.dashboard?.tabLeaf || 'Leaf Health', icon: '🍃' },
    { id: 'mandi', label: t.dashboard?.tabMandi || 'Market Intelligence', icon: '📊' }
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
        padding: '0.65rem 1rem',
        pointerEvents: 'none',
        boxSizing: 'border-box'
      }}
    >
      <style>{`
        .dashboard-nav-container {
          box-sizing: border-box !important;
          width: 100% !important;
          max-width: 1380px !important;
          background: rgba(255, 255, 255, 0.95) !important;
          backdrop-filter: blur(20px) !important;
          -webkit-backdrop-filter: blur(20px) !important;
          border: 1px solid rgba(22, 101, 52, 0.14) !important;
          border-radius: 26px !important;
          padding: 0.45rem 0.85rem !important;
          box-shadow: 0 10px 30px -4px rgba(15, 56, 30, 0.08), 0 2px 8px -2px rgba(15, 56, 30, 0.04) !important;
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          gap: 0.65rem !important;
          transition: all 0.25s ease !important;
        }

        .dashboard-brand-left {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          flex-shrink: 0;
          min-width: 0;
          user-select: none;
        }

        .desktop-dashboard-tabs {
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(241, 245, 249, 0.85);
          padding: 3px;
          border-radius: 9999px;
          border: 1px solid #e2e8f0;
          gap: 2px;
          flex: 0 1 auto;
          min-width: 0;
        }

        .dashboard-tab-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.36rem 0.78rem;
          border-radius: 9999px;
          font-size: 0.83rem;
          white-space: nowrap;
          cursor: pointer;
          transition: all 0.18s ease;
          flex-shrink: 0;
        }

        .dashboard-actions-right {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          flex-shrink: 0;
          min-width: 0;
          justify-content: flex-end;
        }

        .dashboard-user-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.36rem 0.75rem;
          border-radius: 9999px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          color: #1e293b;
          font-size: 0.82rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.18s ease;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
          flex-shrink: 0;
          white-space: nowrap;
        }

        .dashboard-settings-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.36rem 0.72rem;
          border-radius: 9999px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          color: #334155;
          font-size: 0.82rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.18s ease;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
          flex-shrink: 0;
          white-space: nowrap;
        }

        .dashboard-logout-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.36rem 0.8rem;
          border-radius: 9999px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          font-size: 0.82rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.18s ease;
          box-shadow: 0 1px 3px rgba(220, 38, 38, 0.05);
          flex-shrink: 0;
          white-space: nowrap;
          margin-right: 0 !important;
        }

        .mobile-hamburger-btn {
          display: none;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: rgba(15, 56, 30, 0.06);
          border: 1px solid rgba(15, 56, 30, 0.1);
          align-items: center;
          justify-content: center;
          cursor: pointer;
          padding: 7px;
          flex-shrink: 0;
        }

        /* Large desktop view (1200px+) */
        @media (min-width: 1200px) {
          .dashboard-nav-container {
            padding: 0.45rem 1.15rem !important;
            gap: 1rem !important;
          }
          .dashboard-tab-btn {
            padding: 0.38rem 0.95rem !important;
            font-size: 0.85rem !important;
          }
        }

        /* Medium desktop / laptop (1025px - 1199px) */
        @media (max-width: 1199px) and (min-width: 1025px) {
          .dashboard-nav-container {
            padding: 0.4rem 0.75rem !important;
            gap: 0.45rem !important;
          }
          .dashboard-tab-btn {
            padding: 0.32rem 0.65rem !important;
            font-size: 0.8rem !important;
            gap: 0.25rem !important;
          }
          .dashboard-actions-right {
            gap: 0.25rem !important;
          }
          .dashboard-user-btn,
          .dashboard-settings-btn,
          .dashboard-logout-btn {
            padding: 0.32rem 0.65rem !important;
            font-size: 0.8rem !important;
          }
        }

        /* Tablet / Compact Desktop (<= 1024px) */
        @media (max-width: 1024px) {
          .desktop-dashboard-tabs {
            display: none !important;
          }
          .mobile-hamburger-btn {
            display: flex !important;
          }
          .dashboard-nav-container {
            padding: 0.45rem 0.85rem !important;
          }
        }

        /* Mobile / Compact (< 640px) */
        @media (max-width: 640px) {
          .brand-subtitle {
            display: none !important;
          }
          .desktop-settings-text {
            display: none !important;
          }
          .user-name-display {
            display: none !important;
          }
          .dashboard-logout-btn span:last-child {
            display: none !important;
          }
          .dashboard-logout-btn {
            padding: 0.36rem 0.6rem !important;
          }
          .dashboard-actions-right {
            gap: 0.25rem !important;
          }
        }
      `}</style>

      {/* Floating Pill Glass Navbar for Dashboard */}
      <div className="floating-navbar-pill dashboard-nav-container" style={{ pointerEvents: 'auto' }}>
        {/* Left: Brand Identity */}
        <div className="dashboard-brand-left">
          <div
            className="brand-icon-box"
            style={{
              width: '36px',
              height: '36px',
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
              src={assetPath('/images/agriai-emblem-transparent.png')}
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
                fontSize: '1.15rem',
                color: 'var(--color-green-dark)',
                letterSpacing: '-0.025em',
                lineHeight: 1.1
              }}
            >
              AgriAI
            </div>
            <div
              className="brand-subtitle"
              style={{
                fontSize: '0.68rem',
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
        <nav className="desktop-dashboard-tabs">
          {tabs.map((tab) => {
            const isCurrent = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className="dashboard-tab-btn"
                style={{
                  fontWeight: isCurrent ? 800 : 600,
                  color: isCurrent ? '#166534' : '#475569',
                  background: isCurrent ? '#eaf3e6' : 'transparent',
                  boxShadow: isCurrent ? '0 2px 6px rgba(22, 101, 52, 0.12)' : 'none',
                  border: isCurrent ? '1px solid #c7e1be' : '1px solid transparent'
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
                <span style={{ fontSize: '0.92rem' }}>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: User Profile + Settings + Logout */}
        <div className="dashboard-actions-right">
          {/* 👤 My Profile Button */}
          <button
            type="button"
            onClick={onOpenProfile}
            title={t.myProfile?.modalTitle || 'My Profile'}
            className="dashboard-user-btn"
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
            <span style={{ fontSize: '1rem' }}>{avatar.emoji || '👤'}</span>
            <span
              className="user-name-display"
              style={{
                textTransform: 'capitalize',
                maxWidth: '90px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {user?.name || 'Ramesh'}
            </span>
            <span style={{ fontSize: '0.68rem', color: '#64748b', marginLeft: '1px' }}>⌵</span>
          </button>

          {/* ⚙️ Settings Button */}
          <button
            type="button"
            onClick={onOpenSettings}
            title={t.settings?.modalTitle || 'Settings'}
            className="dashboard-settings-btn"
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

          <div
            style={{
              marginTop: '0.5rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid rgba(15, 56, 30, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}
          >
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
