import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../i18n';
import LanguageSelector from './LanguageSelector';

export default function LandingNavbar({ onNavigate, onGetStarted }) {
  const { t } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const navContainerRef = useRef(null);
  const navItemRefs = useRef({});

  const navItems = [
    { id: 'hero', label: t.nav?.home || 'Home' },
    { id: 'about', label: t.nav?.about || 'About' },
    { id: 'features', label: t.nav?.features || 'Features' },
    { id: 'how-it-works', label: t.nav?.howItWorks || 'How It Works' },
    { id: 'technology', label: t.nav?.technology || 'Technology' },
  ];

  // Scroll detection for compact floating state & active section tracking
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setScrolled(scrollY > 25);

      const sections = ['hero', 'about', 'features', 'how-it-works', 'technology'];
      const scrollPosition = scrollY + 160;

      for (let i = sections.length - 1; i >= 0; i--) {
        const secEl = document.getElementById(sections[i]);
        if (secEl) {
          const top = secEl.offsetTop;
          if (scrollPosition >= top) {
            setActiveSection(sections[i]);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update sliding pill indicator position
  useEffect(() => {
    if (navContainerRef.current) {
      const activeEl = navItemRefs.current[activeSection];
      if (activeEl) {
        const containerRect = navContainerRef.current.getBoundingClientRect();
        const itemRect = activeEl.getBoundingClientRect();
        setIndicatorStyle({
          left: itemRect.left - containerRect.left,
          width: itemRect.width,
          opacity: 1
        });
      } else {
        setIndicatorStyle((prev) => ({ ...prev, opacity: 0 }));
      }
    }
  }, [activeSection, t]);

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else if (id === 'hero') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleActionClick = () => {
    setMobileMenuOpen(false);
    if (onGetStarted) {
      onGetStarted();
    } else if (onNavigate) {
      onNavigate('login');
    }
  };

  return (
    <header
      id="landing-navbar-header"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 950,
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        padding: scrolled ? '0.5rem 1rem' : '0.85rem 1.25rem',
        pointerEvents: 'none',
        transition: 'padding 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {/* Floating Pill Glass Navbar */}
      <div
        className="floating-navbar-pill"
        style={{
          pointerEvents: 'auto',
          width: '100%',
          maxWidth: '1240px',
          background: scrolled
            ? 'rgba(255, 255, 255, 0.94)'
            : 'rgba(255, 255, 255, 0.88)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(22, 101, 52, 0.14)',
          borderRadius: scrolled ? '22px' : '28px',
          padding: scrolled ? '0.45rem 1rem' : '0.55rem 1.35rem',
          boxShadow: scrolled
            ? '0 12px 36px -4px rgba(15, 56, 30, 0.12), 0 4px 12px -2px rgba(15, 56, 30, 0.04)'
            : '0 6px 24px -2px rgba(15, 56, 30, 0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
          animation: 'navbarEntrance 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}
      >
        {/* Left: Brand Area */}
        <div
          onClick={() => scrollToSection('hero')}
          className="navbar-brand-wrapper"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            cursor: 'pointer',
            userSelect: 'none',
            textDecoration: 'none',
            transition: 'transform 0.2s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <img
            src="/images/agriai-logo-full-transparent.png"
            alt="AgriAI - Offline AI Farming Platform"
            style={{
              height: '42px',
              width: 'auto',
              maxHeight: '44px',
              objectFit: 'contain',
              display: 'block'
            }}
          />
        </div>

        {/* Center Nav - Landing Page Links with Sliding Pill Indicator */}
        <nav
          ref={navContainerRef}
          className="desktop-nav-links"
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(15, 56, 30, 0.04)',
            padding: '0.22rem',
            borderRadius: 'var(--radius-full)',
            border: '1px solid rgba(22, 101, 52, 0.08)'
          }}
        >
          {/* Sliding Pill Indicator */}
          <div
            style={{
              position: 'absolute',
              top: '3px',
              bottom: '3px',
              left: `${indicatorStyle.left}px`,
              width: `${indicatorStyle.width}px`,
              background: '#ffffff',
              borderRadius: 'var(--radius-full)',
              boxShadow: '0 2px 8px rgba(15, 56, 30, 0.08), 0 1px 2px rgba(0,0,0,0.04)',
              opacity: indicatorStyle.opacity,
              transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
              pointerEvents: 'none',
              zIndex: 1
            }}
          />

          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                ref={(el) => (navItemRefs.current[item.id] = el)}
                type="button"
                onClick={() => scrollToSection(item.id)}
                style={{
                  position: 'relative',
                  zIndex: 2,
                  padding: '0.36rem 0.85rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.84rem',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? 'var(--color-green-dark)' : '#4b5563',
                  background: 'transparent',
                  border: 'none',
                  transition: 'color 0.2s ease, transform 0.2s ease',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = 'var(--color-green-main)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = '#4b5563';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right Section Actions: Language Selector + Get Started Button (NO login button) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <LanguageSelector />

          <div className="desktop-auth-buttons" style={{ display: 'flex', alignItems: 'center' }}>
            <button
              type="button"
              onClick={handleActionClick}
              style={{
                padding: '0.46rem 1.35rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#ffffff',
                background: 'linear-gradient(135deg, #0f381e 0%, #166534 100%)',
                boxShadow: '0 4px 14px rgba(15, 56, 30, 0.22)',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 18px rgba(15, 56, 30, 0.32)';
                e.currentTarget.style.filter = 'brightness(1.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(15, 56, 30, 0.22)';
                e.currentTarget.style.filter = 'none';
              }}
            >
              <span>{t.nav?.getStarted || 'Get Started →'}</span>
            </button>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            className="mobile-hamburger-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
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
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
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
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  transformOrigin: 'left center',
                  transform: mobileMenuOpen ? 'rotate(-45deg) translate(0px, 1px)' : 'none'
                }}
              />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Slide-Down Drawer */}
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
            animation: 'dropdownScale 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            zIndex: 100
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => scrollToSection(item.id)}
                  style={{
                    textAlign: 'left',
                    padding: '0.65rem 1rem',
                    borderRadius: '12px',
                    fontSize: '0.94rem',
                    fontWeight: isActive ? 800 : 600,
                    color: isActive ? 'var(--color-green-dark)' : '#334155',
                    background: isActive ? 'var(--color-green-subtle)' : 'transparent',
                    border: isActive ? '1px solid var(--border-green)' : '1px solid transparent',
                    transition: 'all 0.18s ease'
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(15, 56, 30, 0.08)' }}>
            <button
              type="button"
              onClick={handleActionClick}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: 'var(--radius-full)',
                background: 'linear-gradient(135deg, #0f381e, #166534)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.94rem',
                border: 'none',
                boxShadow: '0 4px 12px rgba(15, 56, 30, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                cursor: 'pointer'
              }}
            >
              <span>{t.nav?.getStarted || 'Get Started →'}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
