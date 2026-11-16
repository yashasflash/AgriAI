import React from 'react';
import { useTranslation } from '../i18n';
import ScrollReveal from './motion/ScrollReveal';
import assetPath from '../utils/assetPath';

export default function About() {
  const { t } = useTranslation();

  const cards = t.about?.cards || [
    {
      icon: '🌾',
      title: 'Crop Advisory',
      desc: 'Match your soil nutrients and local weather with the best-suited crops.'
    },
    {
      icon: '🧪',
      title: 'Soil & Nutrients',
      desc: 'Understand N-P-K balance and soil pH for optimal fertility.'
    },
    {
      icon: '🍃',
      title: 'Plant Health',
      desc: 'Check leaf conditions early to prevent crop damage.'
    },
    {
      icon: '🎤',
      title: 'Voice Assistant',
      desc: 'Speak naturally in your local language instead of typing.'
    }
  ];

  return (
    <section
      id="about"
      style={{
        padding: '6.5rem 1.5rem',
        background: 'var(--bg-page)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
        {/* Section Header (Moves gently upward on scroll) */}
        <ScrollReveal from="bottom" distance={60}>
          <div style={{ textAlign: 'center', maxWidth: '760px', margin: '0 auto 4rem' }}>
            <span
              style={{
                fontSize: '0.82rem',
                fontWeight: 800,
                letterSpacing: '0.1em',
                color: 'var(--color-green-main)',
                textTransform: 'uppercase',
                display: 'inline-block',
                marginBottom: '0.65rem'
              }}
            >
              {t.about?.tag || 'ABOUT AGRIAI'}
            </span>
            <h2
              className="font-serif"
              style={{
                fontSize: 'clamp(2.1rem, 4vw, 3.1rem)',
                fontWeight: 800,
                color: 'var(--color-green-dark)',
                lineHeight: 1.2,
                marginBottom: '1.15rem',
                letterSpacing: '-0.02em'
              }}
            >
              {t.about?.heading || 'Farming Intelligence, Made Simple.'}
            </h2>
            <p
              style={{
                fontSize: '1.08rem',
                color: 'var(--text-muted)',
                lineHeight: 1.68,
                fontWeight: 450
              }}
            >
              {t.about?.description || 'AgriAI brings farming guidance into one simple platform, helping users understand crops, soil, plant health and everyday farming questions.'}
            </p>
          </div>
        </ScrollReveal>

        {/* Content Split: Left Image (Enters from LEFT) & Right Cards (Enters from RIGHT) */}
        <div
          className="about-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '3rem',
            alignItems: 'center'
          }}
        >
          {/* Left: Authentic Visual Frame (Enters from Left with Organic Settle) */}
          <ScrollReveal from="left" distance={120} threshold={0.4}>
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  borderRadius: '26px',
                  overflow: 'hidden',
                  boxShadow: '0 20px 48px -12px rgba(15, 56, 30, 0.14)',
                  border: '1px solid rgba(22, 101, 52, 0.14)',
                  aspectRatio: '4/3',
                  position: 'relative'
                }}
              >
                <img
                  src={assetPath("/images/login-bg.jpg")}
                  alt="Farmer working in agricultural fields"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                    transition: 'transform 0.5s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to top, rgba(15, 56, 30, 0.8) 0%, transparent 60%)'
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: '1.5rem',
                    left: '1.5rem',
                    right: '1.5rem',
                    color: '#ffffff'
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: '1.18rem', lineHeight: 1.25, marginBottom: '0.25rem' }}>
                    {t.about?.imageBadgeTitle || '100% Local & Offline'}
                  </div>
                  <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>
                    {t.about?.imageBadgeSubtitle || 'Private on your device'}
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Right: 4 Clean Feature Cards (Enters with Staggered Motion) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1.25rem' }}>
            {cards.map((card, idx) => (
              <ScrollReveal
                key={idx}
                from={idx % 2 === 0 ? 'right' : 'bottom'}
                distance={80}
                delay={idx}
                threshold={0.4}
              >
                <div
                  style={{
                    background: '#ffffff',
                    padding: '1.6rem 1.4rem',
                    borderRadius: '20px',
                    border: '1px solid rgba(22, 101, 52, 0.1)',
                    boxShadow: '0 4px 16px -2px rgba(15, 56, 30, 0.04)',
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    height: '100%'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 14px 28px -6px rgba(15, 56, 30, 0.12)';
                    e.currentTarget.style.borderColor = 'rgba(22, 101, 52, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 16px -2px rgba(15, 56, 30, 0.04)';
                    e.currentTarget.style.borderColor = 'rgba(22, 101, 52, 0.1)';
                  }}
                >
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      background: idx % 2 === 0 ? 'var(--color-green-subtle)' : '#fef9c3',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.3rem',
                      marginBottom: '1rem'
                    }}
                  >
                    {card.icon}
                  </div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-green-dark)', marginBottom: '0.45rem' }}>
                    {card.title}
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: '#4b5563', lineHeight: 1.55 }}>
                    {card.desc}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
