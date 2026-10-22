import React from 'react';
import { useTranslation } from '../i18n';

export default function Footer({ onNavigate }) {
  const { t } = useTranslation();

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else if (onNavigate) {
      onNavigate('landing');
      setTimeout(() => {
        const target = document.getElementById(id);
        if (target) target.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const navLinks = [
    { id: 'hero', label: t.nav?.home || 'Home' },
    { id: 'about', label: t.nav?.about || 'About' },
    { id: 'features', label: t.nav?.features || 'Features' },
    { id: 'how-it-works', label: t.nav?.howItWorks || 'How It Works' },
    { id: 'technology', label: t.nav?.technology || 'Technology' }
  ];

  return (
    <footer
      style={{
        background: '#09170e',
        color: '#ffffff',
        padding: '5rem 1.5rem 2.5rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        position: 'relative',
        zIndex: 10
      }}
    >
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
        {/* Top 3-Column Clean Row */}
        <div
          className="footer-columns-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '3.5rem',
            alignItems: 'start',
            marginBottom: '4rem'
          }}
        >
          {/* Left Column: Brand & Slogan */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.15rem' }}>
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  display: 'inline-flex',
                  alignItems: 'center'
                }}
              >
                <img
                  src="/images/agriai-logo-full-transparent.png"
                  alt="AgriAI Logo"
                  style={{ height: '38px', width: 'auto', objectFit: 'contain', display: 'block' }}
                />
              </div>
            </div>

            <p style={{ fontSize: '1.08rem', color: '#f1f5f9', fontWeight: 800, marginBottom: '0.5rem', lineHeight: 1.35 }}>
              {t.footer?.brandSlogan || 'Smart Farming. Smarter Decisions.'}
            </p>

            <p style={{ fontSize: '0.88rem', color: '#94a3b8', lineHeight: 1.65 }}>
              {t.footer?.brandDesc || 'Designed for local/offline AI operation.'}
            </p>
          </div>

          {/* Center Column: Quick Links */}
          <div>
            <h4
              style={{
                fontSize: '0.88rem',
                fontWeight: 800,
                color: '#a3e635',
                marginBottom: '1.25rem',
                letterSpacing: '0.06em',
                textTransform: 'uppercase'
              }}
            >
              {t.footer?.linksHeading || 'Quick Links'}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => scrollToSection(link.id)}
                  style={{
                    textAlign: 'left',
                    color: '#cbd5e1',
                    fontSize: '0.94rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'inline-block',
                    width: 'fit-content',
                    background: 'transparent',
                    border: 'none',
                    padding: 0
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#86efac';
                    e.currentTarget.style.transform = 'translateX(2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#cbd5e1';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  {link.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Mission / Guidance Statement */}
          <div>
            <h4
              style={{
                fontSize: '0.88rem',
                fontWeight: 800,
                color: '#a3e635',
                marginBottom: '1.25rem',
                letterSpacing: '0.06em',
                textTransform: 'uppercase'
              }}
            >
              {t.footer?.rightHeading || 'AgriAI'}
            </h4>
            <p style={{ fontSize: '0.95rem', color: '#cbd5e1', lineHeight: 1.65 }}>
              {t.footer?.rightDesc || 'Simple AI-powered farming guidance.'}
            </p>
          </div>
        </div>

        {/* Bottom Bar Divider & Copyright */}
        <div
          style={{
            paddingTop: '2rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            fontSize: '0.86rem',
            color: '#94a3b8'
          }}
        >
          <div>
            {t.footer?.copyright || '© 2026 AgriAI — Offline AI Farming Intelligence Platform'}
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.28rem 0.85rem',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(34, 197, 94, 0.12)',
              border: '1px solid rgba(34, 197, 94, 0.25)',
              color: '#86efac',
              fontWeight: 700,
              fontSize: '0.78rem'
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#22c55e',
                boxShadow: '0 0 8px #22c55e'
              }}
            />
            <span>{t.footer?.badge || 'Offline Ready'}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
