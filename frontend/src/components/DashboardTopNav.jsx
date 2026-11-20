import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../i18n';
import LanguageSelector from './LanguageSelector';
import { getOrAssignUserAvatar } from '../services/avatar';
import {
  Menu,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

export default function DashboardTopNav({
  user,
  activeTab = 'overview',
  onOpenMobileMenu,
  onOpenProfile,
  onOpenSettings,
  onLogout
}) {
  const { t } = useTranslation();
  const avatar = getOrAssignUserAvatar(user);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const tabLabels = {
    overview: t('dashboard.tabOverview') || 'Overview',
    chat: t('dashboard.tabChat') || 'AI Assistant',
    crop: t('dashboard.tabCrop') || 'Crop Advisory',
    leaf: t('dashboard.tabLeaf') || 'Leaf Health',
    weather: t('dashboard.tabWeather') || 'Weather Intelligence',
    voice: t('dashboard.tabVoice') || 'Voice Assistant',
    mandi: t('dashboard.tabMandi') || 'Market Intelligence'
  };

  const currentTabLabel = tabLabels[activeTab] || tabLabels.overview;

  return (
    <header
      id="agriai-dashboard-topnav"
      className="agri-dashboard-topnav"
      style={{
        height: '66px',
        background: '#FFFFFF',
        borderBottom: '1px solid #E3E8E3',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
        position: 'sticky',
        top: 0,
        zIndex: 900,
        boxShadow: '0 1px 4px rgba(29, 43, 36, 0.02)'
      }}
    >
      {/* Left: Mobile Toggle & SaaS Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0 }}>
        {/* Mobile Hamburger Toggle Button */}
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Open sidebar menu"
          className="mobile-hamburger-btn"
          style={{
            display: 'none',
            background: '#F4F7F4',
            border: '1px solid #D5DDD5',
            color: '#1D2B24',
            borderRadius: '8px',
            width: '40px',
            height: '40px',
            minWidth: '40px',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
            flexShrink: 0
          }}
        >
          <Menu size={20} />
        </button>

        {/* Breadcrumb Display */}
        <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.86rem', minWidth: 0, overflow: 'hidden' }}>
          <span style={{ color: '#718078', fontWeight: 500 }} className="desktop-only-platform-title">
            {t('dashboard.breadcrumbPlatform') || 'AgriAI Platform'}
          </span>
          <span style={{ color: '#A0ACA4' }} className="desktop-only-platform-title">/</span>
          <span style={{ color: '#718078', fontWeight: 500 }} className="desktop-only-breadcrumb">
            {t('dashboard.breadcrumbWorkspace') || 'Workspace'}
          </span>
          <span style={{ color: '#A0ACA4' }} className="desktop-only-breadcrumb">/</span>
          <span style={{ color: '#245C45', fontWeight: 700, textTransform: 'capitalize', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {currentTabLabel}
          </span>
        </nav>
      </div>

      {/* Right Controls: Offline Badge, Language Selector, User Menu */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
        {/* Offline AI Status Pill */}
        <div
          className="desktop-only-pill"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: '#F0F7EE',
            border: '1px solid #CDE2C7',
            padding: '0.35rem 0.75rem',
            borderRadius: '999px',
            fontSize: '0.76rem',
            fontWeight: 700,
            color: '#245C45'
          }}
        >
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
          <span>{t('dashboard.statusOfflineReady') || 'Offline AI Ready'}</span>
        </div>

        {/* Existing Language Selector Component */}
        <div style={{ position: 'relative' }}>
          <LanguageSelector variant="default" />
        </div>

        {/* User Profile Pill & Dropdown */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            aria-expanded={profileDropdownOpen}
            aria-label="User profile menu"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: '#FFFFFF',
              border: '1px solid #D5DDD5',
              padding: '0.3rem 0.55rem 0.3rem 0.4rem',
              borderRadius: '999px',
              cursor: 'pointer',
              transition: 'all 0.16s ease'
            }}
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: avatar.bg,
                border: `1.5px solid ${avatar.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.92rem'
              }}
            >
              {avatar.emoji}
            </div>
            <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#1D2B24' }} className="desktop-only-username">
              {user?.name || 'Ramesh'}
            </span>
            <ChevronDown size={14} style={{ color: '#718078' }} />
          </button>

          {/* Profile Dropdown Menu */}
          {profileDropdownOpen && (
            <div
              role="menu"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '210px',
                background: '#FFFFFF',
                borderRadius: '14px',
                border: '1px solid #E3E8E3',
                boxShadow: '0 10px 25px -5px rgba(29, 43, 36, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
                padding: '0.45rem',
                zIndex: 950,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.2rem'
              }}
            >
              <div style={{ padding: '0.55rem 0.65rem 0.4rem', borderBottom: '1px solid #F1F4F1', marginBottom: '0.2rem' }}>
                <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#1D2B24' }}>
                  {user?.name || 'Ramesh'}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#718078' }}>
                  {avatar.badge || 'Farmer'}
                </div>
              </div>

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setProfileDropdownOpen(false);
                  onOpenProfile();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.5rem 0.65rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'transparent',
                  color: '#1D2B24',
                  fontSize: '0.84rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => (e.target.style.background = '#F4F7F4')}
                onMouseLeave={(e) => (e.target.style.background = 'transparent')}
              >
                <User size={15} style={{ color: '#245C45' }} />
                <span>{t('dashboard.menuProfile') || 'Farmer Profile'}</span>
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setProfileDropdownOpen(false);
                  onOpenSettings();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.5rem 0.65rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'transparent',
                  color: '#1D2B24',
                  fontSize: '0.84rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => (e.target.style.background = '#F4F7F4')}
                onMouseLeave={(e) => (e.target.style.background = 'transparent')}
              >
                <Settings size={15} style={{ color: '#245C45' }} />
                <span>{t('dashboard.menuSettings') || 'Preferences & Settings'}</span>
              </button>

              <div style={{ height: '1px', background: '#F1F4F1', margin: '0.2rem 0' }} />

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setProfileDropdownOpen(false);
                  onLogout();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.5rem 0.65rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'transparent',
                  color: '#b91c1c',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => (e.target.style.background = '#FEE2E2')}
                onMouseLeave={(e) => (e.target.style.background = 'transparent')}
              >
                <LogOut size={15} style={{ color: '#b91c1c' }} />
                <span>{t('dashboard.menuLogout') || 'Sign Out'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
