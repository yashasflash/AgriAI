import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../i18n';
import { useScrollProgress } from '../hooks/useScrollProgress';
import Floating3DCrop from './motion/Floating3DCrop';

export default function Hero({ onExplore, onGetStarted }) {
  const { t } = useTranslation();
  const { scrollY } = useScrollProgress();
  const heroRef = useRef(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const [mouseParallax, setMouseParallax] = useState({ x: 0, y: 0 });

  // Detect desktop fine pointer capability
  useEffect(() => {
    const mediaQuery = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 1024px)');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const updateCapabilities = () => {
      setIsDesktop(mediaQuery.matches && !motionQuery.matches);
    };

    updateCapabilities();
    mediaQuery.addEventListener('change', updateCapabilities);
    motionQuery.addEventListener('change', updateCapabilities);

    return () => {
      mediaQuery.removeEventListener('change', updateCapabilities);
      motionQuery.removeEventListener('change', updateCapabilities);
    };
  }, []);

  // Subtle mouse tracking for the hero background & text
  const handleMouseMove = (e) => {
    if (!isDesktop || !heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
    const y = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
    setMouseParallax({
      x: Math.max(-1, Math.min(1, x)),
      y: Math.max(-1, Math.min(1, y))
    });
  };

  const handleMouseLeave = () => {
    if (isDesktop) {
      setMouseParallax({ x: 0, y: 0 });
    }
  };

  // Scroll-linked transforms: text gently glides upward as user scrolls down
  const textScrollY = -scrollY * 0.22;
  const textOpacity = Math.max(0, 1 - scrollY / 420);

  return (
    <section
      id="hero"
      ref={heroRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="hero-viewport-section"
      style={{
        position: 'relative',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.75rem 1.25rem 3.5rem',
        background: 'radial-gradient(ellipse 90% 70% at 50% 20%, #f4f8f3 0%, #fbfaf6 60%, #f7f4ec 100%)',
        overflow: 'hidden'
      }}
    >
      {/* Soft atmospheric ambient light orbs */}
      <div
        style={{
          position: 'absolute',
          top: '4%',
          right: '8%',
          width: '560px',
          height: '560px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(163, 230, 53, 0.12) 0%, rgba(251, 250, 246, 0) 70%)',
          pointerEvents: 'none',
          zIndex: 1,
          transform: `translate3d(${mouseParallax.x * -12}px, ${mouseParallax.y * -12 - scrollY * 0.15}px, 0)`
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '6%',
          left: '6%',
          width: '580px',
          height: '580px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(34, 197, 94, 0.1) 0%, rgba(251, 250, 246, 0) 70%)',
          pointerEvents: 'none',
          zIndex: 1,
          transform: `translate3d(${mouseParallax.x * 10}px, ${mouseParallax.y * 10 - scrollY * 0.12}px, 0)`
        }}
      />

      {/* Central Floating Hero Panel */}
      <div
        className="floating-hero-panel"
        style={{
          position: 'relative',
          zIndex: 10,
          width: '92vw',
          maxWidth: '1440px',
          background: '#ffffff',
          borderRadius: '30px',
          border: '1px solid rgba(22, 101, 52, 0.12)',
          boxShadow: '0 25px 65px -15px rgba(15, 56, 30, 0.10), 0 10px 24px -6px rgba(15, 56, 30, 0.04), 0 0 0 1px rgba(22, 101, 52, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'heroPanelEntrance 0.85s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          transform: isDesktop
            ? `translate3d(${mouseParallax.x * 4}px, ${mouseParallax.y * 4}px, 0)`
            : 'none',
          transition: isDesktop ? 'transform 0.25s cubic-bezier(0.25, 1, 0.5, 1)' : 'none'
        }}
      >
        {/* Two-Column Content Layout */}
        <div
          className="hero-inner-columns"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '3.5rem 4rem 4rem',
            gap: '3rem'
          }}
        >
          {/* Left Column: Typography & Actions (Scrolls upward gracefully) */}
          <div
            className="hero-left-column"
            style={{
              flex: '1 1 50%',
              maxWidth: '620px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              transform: `translate3d(0, ${textScrollY}px, 0)`,
              opacity: textOpacity,
              transition: 'transform 0.08s linear, opacity 0.08s linear'
            }}
          >
            {/* Small Elegant Eyebrow */}
            <div
              className="animate-eyebrow"
              style={{
                fontSize: '0.82rem',
                fontWeight: 800,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#166534',
                marginBottom: '1.15rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <span>🌱</span>
              <span>{t.hero?.eyebrow || 'SMART FARMING, SIMPLIFIED'}</span>
            </div>

            {/* Dominant Main Heading with Staggered Lines */}
            <h1
              className="font-serif"
              style={{
                fontSize: 'clamp(2.6rem, 4.5vw, 4.2rem)',
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: '-0.035em',
                color: '#0f381e',
                margin: '0 0 1.25rem'
              }}
            >
              <span className="animate-heading-1" style={{ display: 'inline-block' }}>
                {t.hero?.titleLine1 || 'Smart Farming.'}
              </span>
              <br />
              <span
                className="animate-heading-2"
                style={{
                  display: 'inline-block',
                  background: 'linear-gradient(135deg, #166534 0%, #22c55e 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                {t.hero?.titleLine2 || 'Smarter Decisions.'}
              </span>
            </h1>

            {/* Supporting Text */}
            <p
              className="animate-hero-desc"
              style={{
                fontSize: 'clamp(1.02rem, 1.3vw, 1.15rem)',
                lineHeight: 1.68,
                color: '#475569',
                marginBottom: '2.5rem',
                fontWeight: 450,
                maxWidth: '520px'
              }}
            >
              {t.hero?.subtitle || 'AgriAI helps farmers ask questions, choose suitable crops, and understand plant health with local AI.'}
            </p>

            {/* Action Buttons Row */}
            <div
              className="animate-hero-actions hero-btn-row"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.1rem',
                flexWrap: 'wrap'
              }}
            >
              {/* Explore AgriAI Button */}
              <button
                type="button"
                onClick={onExplore}
                className="hero-secondary-btn"
                style={{
                  padding: '0.9rem 2.1rem',
                  borderRadius: 'var(--radius-full)',
                  background: '#f8fafc',
                  border: '1px solid rgba(22, 101, 52, 0.22)',
                  color: 'var(--color-green-dark)',
                  fontSize: '0.96rem',
                  fontWeight: 700,
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
                  cursor: 'pointer',
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(15, 56, 30, 0.12)';
                  e.currentTarget.style.background = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.04)';
                  e.currentTarget.style.background = '#f8fafc';
                }}
              >
                {t.hero?.exploreBtn || 'Explore AgriAI'}
              </button>

              {/* Get Started Button */}
              <button
                type="button"
                onClick={onGetStarted}
                className="hero-primary-btn"
                style={{
                  padding: '0.9rem 2.35rem',
                  borderRadius: 'var(--radius-full)',
                  background: 'linear-gradient(135deg, #0f381e 0%, #166534 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '0.96rem',
                  fontWeight: 800,
                  boxShadow: '0 6px 20px rgba(15, 56, 30, 0.26)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 10px 26px rgba(15, 56, 30, 0.36)';
                  e.currentTarget.style.filter = 'brightness(1.06)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(15, 56, 30, 0.26)';
                  e.currentTarget.style.filter = 'none';
                }}
              >
                <span>{t.hero?.getStartedBtn || 'Get Started →'}</span>
              </button>
            </div>
          </div>

          {/* Right Column: Realistic Floating 3D Agricultural Visual */}
          <div
            className="hero-right-column"
            style={{
              flex: '1 1 50%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative'
            }}
          >
            <Floating3DCrop scrollY={scrollY} isDesktop={isDesktop} />
          </div>
        </div>
      </div>

      {/* Subtle Scroll Down Indicator */}
      <button
        type="button"
        onClick={onExplore}
        aria-label="Scroll to about section"
        style={{
          marginTop: '1.75rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.25rem',
          background: 'transparent',
          border: 'none',
          color: '#64748b',
          cursor: 'pointer',
          padding: '0.5rem',
          animation: 'scrollIndicatorFloat 2.2s ease-in-out infinite',
          transition: 'color 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#166534';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = '#64748b';
        }}
      >
        <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Explore
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
    </section>
  );
}
