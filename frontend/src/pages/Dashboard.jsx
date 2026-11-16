import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n';
import DashboardNavbar from '../components/DashboardNavbar';
import WeatherCard from '../components/WeatherCard';
import ChatAssistant from '../components/ChatAssistant';
import CropRecommendation from '../components/CropRecommendation';
import LeafHealth from '../components/LeafHealth';
import MyProfileModal from '../components/MyProfileModal';
import SettingsModal from '../components/SettingsModal';
import assetPath from '../utils/assetPath';

export default function Dashboard({ user, activeTab: externalTab = 'chat', onTabChange: externalTabChange, onUserUpdated, onLogout }) {
  const { t } = useTranslation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(externalTab);

  // Sync external tab if changed
  useEffect(() => {
    if (externalTab) {
      setActiveTab(externalTab);
    }
  }, [externalTab]);

  // Sync active navigation tab with user scroll position
  useEffect(() => {
    const sectionIds = ['ai-assistant-section', 'crop-advisory-section', 'leaf-health-section'];
    const tabMap = {
      'ai-assistant-section': 'chat',
      'crop-advisory-section': 'crop',
      'leaf-health-section': 'leaf'
    };

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollPos = window.scrollY + 160;
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

  // Smooth scroll to targeted feature section when clicked from navbar or chips
  const handleTabNavigation = (tabId) => {
    setActiveTab(tabId);
    if (externalTabChange) externalTabChange(tabId);

    const targetMap = {
      chat: 'ai-assistant-section',
      crop: 'crop-advisory-section',
      leaf: 'leaf-health-section'
    };
    const targetEl = document.getElementById(targetMap[tabId]);
    if (targetEl) {
      const navOffset = 85;
      const elementRect = targetEl.getBoundingClientRect().top;
      const offsetPosition = elementRect + window.pageYOffset - navOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div
      className="dashboard-page-wrapper"
      style={{
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}
    >
      {/* ============================================================ */}
      {/* ATMOSPHERIC AGRICULTURAL BACKGROUND LAYERS (STABLE SCROLL)   */}
      {/* ============================================================ */}

      {/* Layer 1: Photorealistic Farm Atmosphere Layer (Fixed relative to page content) */}
      <div
        className="dashboard-bg-photo-layer"
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          minHeight: '100%',
          backgroundImage: `url('${assetPath("/images/hero.jpg")}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
          opacity: 0.07,
          filter: 'blur(3px) saturate(0.85)',
          maskImage: 'radial-gradient(ellipse 75% 65% at 50% 50%, transparent 42%, black 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 75% 65% at 50% 50%, transparent 42%, black 100%)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      {/* Layer 2: Ambient Warm Sunlight Glow (Opacity breathe only - no scroll translation) */}
      <div
        className="dashboard-sunlight-drift"
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '750px',
          height: '750px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(234, 179, 8, 0.08) 0%, rgba(163, 230, 53, 0.05) 45%, transparent 70%)',
          filter: 'blur(36px)',
          animation: 'sunlightDrift 22s ease-in-out infinite alternate',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />
      <div
        className="dashboard-sunlight-drift"
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '680px',
          height: '680px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(34, 197, 94, 0.06) 0%, rgba(241, 245, 234, 0.04) 50%, transparent 70%)',
          filter: 'blur(40px)',
          animation: 'sunlightDrift 26s ease-in-out 3s infinite alternate',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      {/* Layer 3: Faint Dappled Leaf Shadow near top-right outer edge */}
      <div
        className="dashboard-leaf-shadow"
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          right: '3%',
          width: '240px',
          height: 'auto',
          opacity: 0.08,
          filter: 'blur(8px) contrast(1.2)',
          transformOrigin: 'top right',
          animation: 'leafShadowBreathe 16s ease-in-out infinite alternate',
          pointerEvents: 'none',
          zIndex: 0
        }}
      >
        <img
          src={assetPath("/images/real-leaf-1.png")}
          alt=""
          style={{
            width: '100%',
            height: 'auto',
            filter: 'brightness(0) saturate(100%)'
          }}
        />
      </div>

      {/* ============================================================ */}
      {/* 1. Logged-in Dashboard Floating Sticky Navbar                */}
      {/* ============================================================ */}
      <div style={{ position: 'relative', zIndex: 950 }}>
        <DashboardNavbar
          user={user}
          activeTab={activeTab}
          onTabChange={handleTabNavigation}
          onOpenProfile={() => setProfileOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
          onLogout={onLogout}
        />
      </div>

      {/* ============================================================ */}
      {/* 2. Scenic Panoramic Dashboard Hero Banner & Weather Widget   */}
      {/* ============================================================ */}
      <section id="dashboard-hero" className="dashboard-panoramic-hero" aria-label="Dashboard Overview">
        {/* Soft Radial/Linear Overlay for Text & Glass Contrast */}
        <div className="dashboard-panoramic-overlay" aria-hidden="true" />

        <div className="dashboard-hero-content-wrapper">
          <div className="dashboard-hero-grid">
            {/* Left: Welcome Greeting & Value Pillars */}
            <div className="dashboard-welcome-col">
              <div
                className="dashboard-badge-pill"
                style={{
                  background: '#dcfce7',
                  border: '1px solid #86efac',
                  color: '#166534',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  letterSpacing: '0.05em',
                  padding: '0.3rem 0.85rem'
                }}
              >
                <span>🌱</span>
                <span>{t.dashboard?.aiPoweredBadge || 'AI-POWERED FARMING WORKSPACE'}</span>
              </div>

              <h1
                className="dashboard-welcome-heading"
                style={{
                  fontSize: 'clamp(2.35rem, 4.2vw, 3.15rem)',
                  fontWeight: 900,
                  color: 'var(--color-green-dark)',
                  letterSpacing: '-0.035em',
                  lineHeight: 1.15,
                  textTransform: 'capitalize',
                  margin: '0.25rem 0 0.45rem'
                }}
              >
                {t.dashboard?.welcome || 'Welcome back'}, {user?.name || 'Ramesh'} 👋
              </h1>

              <p
                className="dashboard-welcome-sub"
                style={{
                  fontSize: '1.05rem',
                  color: '#334155',
                  fontWeight: 500,
                  maxWidth: '540px',
                  lineHeight: 1.55
                }}
              >
                {t.dashboard?.subtitle || 'How can I help with your farming today?'}
              </p>

              {/* 3 Visual Benefit Chips (Interactive Quick Navigation) */}
              <div className="dashboard-benefit-pills">
                <button
                  type="button"
                  onClick={() => handleTabNavigation('crop')}
                  className="benefit-pill"
                  style={{ cursor: 'pointer', border: '1px solid rgba(22, 101, 52, 0.15)' }}
                >
                  <span>🌱</span>
                  <span>{t.dashboard?.betterCrops || 'Better Crops'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTabNavigation('leaf')}
                  className="benefit-pill"
                  style={{ cursor: 'pointer', border: '1px solid rgba(22, 101, 52, 0.15)' }}
                >
                  <span>🍃</span>
                  <span>{t.dashboard?.healthierPlants || 'Healthier Plants'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTabNavigation('chat')}
                  className="benefit-pill"
                  style={{ cursor: 'pointer', border: '1px solid rgba(22, 101, 52, 0.15)' }}
                >
                  <span>🌾</span>
                  <span>{t.dashboard?.smarterFarming || 'Smarter Farming'}</span>
                </button>
              </div>
            </div>

            {/* Right: Floating Frosted Glass Live Weather Card */}
            <div className="dashboard-weather-col">
              <WeatherCard />
            </div>
          </div>
        </div>

        {/* Organic Bottom Wave Divider */}
        <svg
          className="dashboard-wave-divider"
          viewBox="0 0 1440 48"
          fill="none"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0 24C240 44 480 48 720 32C960 16 1200 36 1440 28V48H0V24Z"
            fill="var(--bg-page)"
          />
        </svg>
      </section>

      {/* ============================================================ */}
      {/* 3. Primary AI Assistant Workspace (Full Width Container)     */}
      {/* ============================================================ */}
      <section
        id="ai-assistant-section"
        style={{
          scrollMarginTop: '90px',
          position: 'relative',
          zIndex: 5
        }}
      >
        <div className="dashboard-content-container" style={{ paddingTop: '1.5rem', paddingBottom: '2.5rem' }}>
          <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <ChatAssistant
              user={user}
              onSelectTab={handleTabNavigation}
            />
          </main>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. Smart Agronomy & Plant Health (Crop Advisory & Leaf Check) */}
      {/* ============================================================ */}
      <section
        id="crop-and-leaf-section"
        className="dashboard-features-section"
        style={{
          maxWidth: '1220px',
          width: '100%',
          margin: '0 auto',
          padding: '1rem 1.5rem 4rem',
          position: 'relative',
          zIndex: 5
        }}
      >
        {/* Section Header matching Reference: ── 🌿 Smart Farming Tools ── */}
        <div className="dashboard-section-header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
            <span style={{ width: '36px', height: '2px', background: 'linear-gradient(90deg, transparent, #16a34a)', opacity: 0.7 }} />
            <span style={{ fontSize: '1.25rem' }}>🍃</span>
            <h2
              style={{
                fontSize: 'clamp(1.4rem, 2.5vw, 1.75rem)',
                fontWeight: 800,
                color: '#0f381e',
                letterSpacing: '-0.02em',
                margin: 0
              }}
            >
              Smart Farming Tools
            </h2>
            <span style={{ width: '36px', height: '2px', background: 'linear-gradient(90deg, #16a34a, transparent)', opacity: 0.7 }} />
          </div>
          <p
            style={{
              fontSize: '0.92rem',
              color: '#64748b',
              maxWidth: '540px',
              margin: '0 auto',
              lineHeight: 1.5
            }}
          >
            Practical AI tools for everyday farming decisions
          </p>
        </div>

        <div
          className="dashboard-dual-features-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
            gap: '1.75rem',
            alignItems: 'stretch'
          }}
        >
          {/* Crop Advisory Card */}
          <div id="crop-advisory-section" style={{ scrollMarginTop: '100px', display: 'flex' }}>
            <CropRecommendation />
          </div>

          {/* Leaf Health Check Card */}
          <div id="leaf-health-section" style={{ scrollMarginTop: '100px', display: 'flex' }}>
            <LeafHealth />
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 5. Clean Production Dashboard Footer                          */}
      {/* ============================================================ */}
      <footer
        style={{
          borderTop: '1px solid rgba(22, 101, 52, 0.1)',
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          padding: '1.75rem 1.5rem',
          marginTop: 'auto',
          position: 'relative',
          zIndex: 5,
          overflow: 'hidden'
        }}
      >
        {/* Subtle Botanical Leaf Watermark at bottom right corner */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: '-25px',
            right: '-15px',
            width: '130px',
            height: 'auto',
            opacity: 0.14,
            pointerEvents: 'none',
            zIndex: 0
          }}
        >
          <img
            src={assetPath("/images/real-leaf-3.png")}
            alt=""
            style={{ width: '100%', height: 'auto', transform: 'rotate(-25deg)' }}
          />
        </div>

        <div
          style={{
            maxWidth: '1220px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            position: 'relative',
            zIndex: 1
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img
              src={assetPath("/images/agriai-logo-full-transparent.png")}
              alt="AgriAI - Offline AI Farming Platform"
              style={{
                height: '36px',
                width: 'auto',
                objectFit: 'contain',
                display: 'block'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#166534' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
              Local AI Active
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#166534' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
              100% Private & Local
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
  );
}

