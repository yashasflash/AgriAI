import React from 'react';
import { useTranslation } from '../i18n';
import Hero from '../components/Hero';
import About from '../components/About';
import Features from '../components/Features';
import HowItWorks from '../components/HowItWorks';
import Technology from '../components/Technology';
import CinematicFallingLeaf from '../components/motion/CinematicFallingLeaf';
import ScrollReveal from '../components/motion/ScrollReveal';
import assetPath from '../utils/assetPath';

export default function LandingPage({ onGetStarted }) {
  const { t } = useTranslation();

  const handleExplore = () => {
    const el = document.getElementById('about');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="landing-page-container" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* ONE Single Large Photorealistic Foreground Leaf Falling Cinematographically on Scroll */}
      <CinematicFallingLeaf />

      {/* 1. First Screen Hero with Floating 3D Crop */}
      <Hero onExplore={handleExplore} onGetStarted={onGetStarted} />

      {/* 2. About AgriAI (Image enters from LEFT, cards from RIGHT) */}
      <About />

      {/* 3. Features (Multi-directional scroll entrances) */}
      <Features onNavigateToFeature={onGetStarted} />

      {/* 4. How AgriAI Works (Flowing scroll connected process) */}
      <HowItWorks />

      {/* 5. Technology (Calm & stable intelligence) */}
      <Technology />

      {/* 6. Final Get Started CTA */}
      <section
        style={{
          padding: '6.5rem 1.5rem',
          background: 'linear-gradient(135deg, #09170e 0%, #0f381e 100%)',
          color: '#ffffff',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url('${assetPath("/images/hero.jpg")}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.18,
            pointerEvents: 'none'
          }}
        />

        <div style={{ position: 'relative', zIndex: 5, maxWidth: '800px', margin: '0 auto' }}>
          <ScrollReveal from="bottom" distance={60}>
            <span
              style={{
                fontSize: '0.85rem',
                fontWeight: 800,
                color: '#a3e635',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                display: 'inline-block',
                marginBottom: '1rem'
              }}
            >
              🌾 {t.cta?.tag || 'GET STARTED'}
            </span>
            <h2
              className="font-serif"
              style={{
                fontSize: 'clamp(2.3rem, 5vw, 3.6rem)',
                fontWeight: 800,
                lineHeight: 1.15,
                marginBottom: '1.25rem',
                letterSpacing: '-0.025em'
              }}
            >
              {t.cta?.heading || 'Ready for Smarter Farming?'}
            </h2>
            <p
              style={{
                fontSize: '1.15rem',
                color: '#cbd5e1',
                marginBottom: '2.5rem',
                lineHeight: 1.65,
                maxWidth: '640px',
                margin: '0 auto 2.5rem'
              }}
            >
              {t.cta?.subtitle || 'Explore AgriAI and make your next farming decision with better guidance.'}
            </p>

            <button
              type="button"
              onClick={onGetStarted}
              style={{
                padding: '1rem 2.75rem',
                borderRadius: 'var(--radius-full)',
                background: 'linear-gradient(135deg, #a3e635, #22c55e)',
                color: '#09170e',
                fontSize: '1.05rem',
                fontWeight: 800,
                boxShadow: '0 8px 26px rgba(163, 230, 53, 0.4)',
                transition: 'all var(--transition-normal)',
                border: 'none',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 30px rgba(163, 230, 53, 0.55)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 26px rgba(163, 230, 53, 0.4)';
              }}
            >
              {t.cta?.getStartedBtn || 'Get Started →'}
            </button>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
