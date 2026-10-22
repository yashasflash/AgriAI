import React from 'react';
import { useTranslation } from '../i18n';
import ScrollReveal from './motion/ScrollReveal';

export default function Technology() {
  const { t } = useTranslation();

  const items = t.technology?.items || [
    {
      icon: '🤖',
      title: 'Local AI',
      desc: 'Intelligent conversational assistance running directly on your device.'
    },
    {
      icon: '🌱',
      title: 'Machine Learning',
      desc: 'Scientific crop prediction using soil chemistry and weather data.'
    },
    {
      icon: '🍃',
      title: 'Computer Vision',
      desc: 'Instant leaf analysis to detect plant health conditions.'
    },
    {
      icon: '⚡',
      title: 'Local Database',
      desc: 'All your chat history and records stay 100% private and offline.'
    }
  ];

  return (
    <section
      id="technology"
      style={{
        padding: '6rem 1.5rem',
        background: '#ffffff',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div style={{ maxWidth: '1180px', margin: '0 auto', textAlign: 'center' }}>
        {/* Section Header */}
        <ScrollReveal from="bottom" distance={50}>
          <div style={{ marginBottom: '3.5rem', maxWidth: '720px', margin: '0 auto 3.5rem' }}>
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
              {t.technology?.tag || 'TECHNOLOGY'}
            </span>
            <h2
              className="font-serif"
              style={{
                fontSize: 'clamp(2.1rem, 4vw, 3.1rem)',
                fontWeight: 800,
                color: 'var(--color-green-dark)',
                lineHeight: 1.2,
                marginBottom: '0.85rem',
                letterSpacing: '-0.02em'
              }}
            >
              {t.technology?.heading || 'Technology Behind AgriAI'}
            </h2>
            <p
              style={{
                fontSize: '1.08rem',
                color: 'var(--text-muted)',
                lineHeight: 1.65,
                fontWeight: 450
              }}
            >
              {t.technology?.subtitle || 'Simple, reliable, and private local intelligence.'}
            </p>
          </div>
        </ScrollReveal>

        {/* 4 Clean Technology Cards with Calm Scroll Settle */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem'
          }}
        >
          {items.map((item, idx) => (
            <ScrollReveal
              key={idx}
              from={idx % 2 === 0 ? 'bottom' : 'zoom'}
              distance={60}
              delay={idx}
              threshold={0.4}
            >
              <div
                style={{
                  background: '#fbfaf6',
                  borderRadius: '22px',
                  border: '1px solid rgba(22, 101, 52, 0.12)',
                  padding: '2rem 1.6rem',
                  boxShadow: '0 4px 16px rgba(15, 56, 30, 0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  textAlign: 'left',
                  height: '100%',
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 14px 28px -6px rgba(15, 56, 30, 0.12)';
                  e.currentTarget.style.borderColor = 'rgba(22, 101, 52, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(15, 56, 30, 0.04)';
                  e.currentTarget.style.borderColor = 'rgba(22, 101, 52, 0.12)';
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '14px',
                    background: '#ffffff',
                    border: '1px solid rgba(22, 101, 52, 0.14)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    marginBottom: '1.25rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                  }}
                >
                  {item.icon}
                </div>
                <h3
                  style={{
                    fontWeight: 800,
                    fontSize: '1.18rem',
                    color: 'var(--color-green-dark)',
                    marginBottom: '0.5rem',
                    lineHeight: 1.3
                  }}
                >
                  {item.title}
                </h3>
                <p style={{ fontSize: '0.92rem', color: '#4b5563', lineHeight: 1.6 }}>
                  {item.desc}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
