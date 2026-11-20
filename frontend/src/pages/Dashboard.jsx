import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n';
import DashboardSidebar from '../components/DashboardSidebar';
import DashboardTopNav from '../components/DashboardTopNav';
import DashboardOverview from '../components/DashboardOverview';
import ChatAssistant from '../components/ChatAssistant';
import CropRecommendation from '../components/CropRecommendation';
import LeafHealth from '../components/LeafHealth';
import MarketIntelligenceHub from '../components/MarketIntelligenceHub';
import MyProfileModal from '../components/MyProfileModal';
import SettingsModal from '../components/SettingsModal';
import assetPath from '../utils/assetPath';

export default function Dashboard({
  user,
  activeTab: externalTab = 'overview',
  onTabChange: externalTabChange,
  onUserUpdated,
  onLogout
}) {
  const { t } = useTranslation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(externalTab || 'overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Sync external tab if changed from parent App
  useEffect(() => {
    if (externalTab) {
      setActiveTab(externalTab);
    }
  }, [externalTab]);

  // Sync active navigation tab with user scroll position
  useEffect(() => {
    const sectionIds = [
      'overview-section',
      'weather-section',
      'ai-assistant-section',
      'crop-advisory-section',
      'leaf-health-section',
      'mandi-prices-section'
    ];
    const tabMap = {
      'overview-section': 'overview',
      'weather-section': 'weather',
      'ai-assistant-section': 'chat',
      'crop-advisory-section': 'crop',
      'leaf-health-section': 'leaf',
      'mandi-prices-section': 'mandi'
    };

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollPos = window.scrollY + 180;
          for (let i = sectionIds.length - 1; i >= 0; i--) {
            const el = document.getElementById(sectionIds[i]);
            if (el && el.offsetTop <= scrollPos) {
              setActiveTab(tabMap[sectionIds[i]]);
              break;
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Smooth scroll to targeted feature section when clicked from sidebar, topnav, or quick-access cards
  const handleTabNavigation = (tabId) => {
    setActiveTab(tabId);
    if (externalTabChange) externalTabChange(tabId);

    const targetMap = {
      overview: 'overview-section',
      weather: 'weather-section',
      chat: 'ai-assistant-section',
      voice: 'ai-assistant-section',
      crop: 'crop-advisory-section',
      fertilizer: 'crop-advisory-section',
      leaf: 'leaf-health-section',
      mandi: 'mandi-prices-section'
    };

    const targetEl = document.getElementById(targetMap[tabId]);
    if (targetEl) {
      const navOffset = 85;
      const elementRect = targetEl.getBoundingClientRect().top;
      const offsetPosition = elementRect + window.pageYOffset - navOffset;

      window.scrollTo({
        top: Math.max(0, offsetPosition),
        behavior: 'smooth'
      });
    }
  };

  return (
    <div
      className="agri-saas-dashboard-wrapper"
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: '#F5F7F3',
        color: '#1D2B24',
        position: 'relative'
      }}
    >
      {/* Global SaaS Layout Overrides */}
      <style>{`
        @media (max-width: 1024px) {
          .desktop-only-collapse {
            display: none !important;
          }
          .mobile-only-btn {
            display: flex !important;
          }
          .mobile-hamburger-btn {
            display: flex !important;
          }
          .desktop-only-breadcrumb {
            display: none !important;
          }
          .agri-saas-content-canvas {
            padding: 1.75rem 1.25rem 3rem !important;
          }
        }
        @media (max-width: 640px) {
          .agri-dashboard-topnav {
            padding: 0 0.85rem !important;
          }
          .desktop-only-pill {
            display: none !important;
          }
          .desktop-only-username {
            display: none !important;
          }
          .desktop-only-platform-title {
            display: none !important;
          }
          .agri-saas-content-canvas {
            padding: 1.25rem 0.85rem 2.5rem !important;
          }
          .overview-welcome-banner {
            padding: 1.35rem 1.15rem !important;
            border-radius: 16px !important;
          }
          .market-hub-header-card {
            padding: 1.35rem 1.15rem !important;
            border-radius: 18px !important;
          }
          .readiness-main-card {
            padding: 1.35rem 1.15rem !important;
            border-radius: 18px !important;
          }
          .agri-feature-card {
            padding: 1.25rem 1rem !important;
            border-radius: 18px !important;
          }
          .agri-saas-footer {
            padding: 1.25rem 1rem !important;
          }
        }
        @media (max-width: 380px) {
          .agri-dashboard-topnav {
            padding: 0 0.65rem !important;
          }
          .agri-saas-content-canvas {
            padding: 1rem 0.6rem 2rem !important;
          }
          .overview-welcome-banner {
            padding: 1.15rem 0.85rem !important;
          }
          .market-hub-header-card {
            padding: 1.15rem 0.85rem !important;
          }
          .readiness-main-card {
            padding: 1.15rem 0.85rem !important;
          }
          .agri-feature-card {
            padding: 1rem 0.75rem !important;
          }
          .agri-saas-footer {
            padding: 1rem 0.75rem !important;
          }
        }
      `}</style>

      {/* 1. Collapsible SaaS Sidebar */}
      <DashboardSidebar
        user={user}
        activeTab={activeTab}
        onTabChange={handleTabNavigation}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* 2. Main Scrollable Workspace Area */}
      <div
        className="agri-saas-main-area"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          background: '#F5F7F3'
        }}
      >
        {/* Sticky Top Navigation */}
        <DashboardTopNav
          user={user}
          activeTab={activeTab}
          onOpenMobileMenu={() => setMobileSidebarOpen(true)}
          onOpenProfile={() => setProfileOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
          onLogout={onLogout}
        />

        {/* Content Canvas */}
        <main
          className="agri-saas-content-canvas"
          style={{
            flex: 1,
            padding: '2rem 1.75rem 3.5rem',
            maxWidth: '1380px',
            width: '100%',
            margin: '0 auto',
            boxSizing: 'border-box'
          }}
        >
          {/* SECTION 1: DASHBOARD OVERVIEW & QUICK ACCESS & WEATHER */}
          <DashboardOverview
            user={user}
            onNavigateSection={handleTabNavigation}
          />

          {/* SECTION 2: AI FARMING ASSISTANT WORKSPACE */}
          <section
            id="ai-assistant-section"
            style={{
              scrollMarginTop: '90px',
              marginBottom: '3rem'
            }}
          >
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#EBF3E8', color: '#245C45', padding: '0.25rem 0.65rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>
                <span>💬</span>
                <span>{t('dashboard.tabChat') || 'AI Assistant'}</span>
              </div>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#1D2B24', margin: '0 0 0.25rem 0' }}>
                {t('chat.heading') || 'AI Farming Assistant'}
              </h2>
              <p style={{ fontSize: '0.9rem', color: '#718078', margin: 0 }}>
                {t('chat.emptySubtitle') || 'Ask me about crops, soil, plant health, pests, fertilizers, or everyday farming questions.'}
              </p>
            </div>

            <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E3E8E3', overflow: 'hidden', boxShadow: '0 4px 20px rgba(29, 43, 36, 0.04)' }}>
              <ChatAssistant
                user={user}
                onSelectTab={handleTabNavigation}
              />
            </div>
          </section>

          {/* SECTION 3: CROP ADVISORY & PLANT HEALTH DUAL GRID */}
          <section
            id="crop-and-leaf-section"
            style={{
              scrollMarginTop: '90px',
              marginBottom: '3rem'
            }}
          >
            <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#EBF3E8', color: '#245C45', padding: '0.25rem 0.65rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>
                <span>🌱</span>
                <span>{t('dashboard.navSectionTools') || 'Farming Intelligence'}</span>
              </div>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#1D2B24', margin: '0 0 0.25rem 0' }}>
                Agronomy & Plant Pathology
              </h2>
              <p style={{ fontSize: '0.9rem', color: '#718078', margin: 0 }}>
                Machine learning crop matching and computer vision plant disease diagnostics
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))',
                gap: '1.75rem',
                alignItems: 'stretch'
              }}
            >
              {/* Crop Advisory Card */}
              <div id="crop-advisory-section" style={{ scrollMarginTop: '90px', display: 'flex' }}>
                <CropRecommendation />
              </div>

              {/* Leaf Health Check Card */}
              <div id="leaf-health-section" style={{ scrollMarginTop: '90px', display: 'flex' }}>
                <LeafHealth />
              </div>
            </div>
          </section>

          {/* SECTION 4: UNIFIED MARKET INTELLIGENCE HUB (STAGE 8A PRESERVED) */}
          <section
            id="mandi-prices-section"
            style={{
              scrollMarginTop: '90px',
              marginBottom: '3rem'
            }}
          >
            <MarketIntelligenceHub />
          </section>
        </main>

        {/* 3. Clean SaaS Production Footer */}
        <footer
          className="agri-saas-footer"
          style={{
            borderTop: '1px solid #E3E8E3',
            background: '#FFFFFF',
            padding: '1.5rem 2rem',
            marginTop: 'auto'
          }}
        >
          <div
            style={{
              maxWidth: '1380px',
              margin: '0 auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <img
                src={assetPath("/images/agriai-logo-full-transparent.png")}
                alt="AgriAI"
                style={{
                  height: '32px',
                  width: 'auto',
                  objectFit: 'contain',
                  display: 'block'
                }}
              />
              <span style={{ fontSize: '0.8rem', color: '#718078' }}>
                © 2026 AgriAI — Offline AI Agricultural Technology Platform
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.8rem', color: '#718078', fontWeight: 600 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#245C45' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                {t('dashboard.localAiBadge') || 'Local AI Active'}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#245C45' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                {t('dashboard.offlinePrivacyBadge') || '100% Private & Local'}
              </span>
            </div>
          </div>
        </footer>

        {/* 👤 My Profile Modal */}
        <MyProfileModal
          isOpen={profileOpen}
          onClose={() => setProfileOpen(false)}
          user={user}
          onLogout={onLogout}
        />

        {/* ⚙️ Settings Modal */}
        <SettingsModal
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          user={user}
          onOpenProfile={() => {
            setSettingsOpen(false);
            setProfileOpen(true);
          }}
          onLogout={onLogout}
        />
      </div>
    </div>
  );
}
