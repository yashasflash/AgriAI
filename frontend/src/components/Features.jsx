import React from 'react';
import { useTranslation } from '../i18n';
import ScrollReveal from './motion/ScrollReveal';

export default function Features({ onNavigateToFeature }) {
  const { t } = useTranslation();

  const mainFeatures = [
    {
      id: 'ai-assistant',
      icon: '💬',
      tag: t.features?.f1?.tag || 'FEATURE 01',
      title: t.features?.f1?.title || 'AI Farming Assistant',
      desc: t.features?.f1?.desc || 'Ask farming questions and get clear guidance.',
      bg: '#f0fdf4',
      border: 'rgba(34, 197, 94, 0.2)',
      entrance: 'left' // Enters from LEFT
    },
    {
      id: 'crop-advisory',
      icon: '🌱',
      tag: t.features?.f2?.tag || 'FEATURE 02',
      title: t.features?.f2?.title || 'Crop Advisory',
      desc: t.features?.f2?.desc || 'Use soil and weather information to find a suitable crop.',
      bg: '#f7fee7',
      border: 'rgba(163, 230, 53, 0.25)',
      entrance: 'bottom' // Enters from BOTTOM
    },
    {
      id: 'leaf-health',
      icon: '🍃',
      tag: t.features?.f3?.tag || 'FEATURE 03',
      title: t.features?.f3?.title || 'Leaf Health',
      desc: t.features?.f3?.desc || 'Upload a leaf photo and check its condition.',
      bg: '#ecfdf5',
      border: 'rgba(16, 185, 129, 0.25)',
      entrance: 'right' // Enters from RIGHT
    }
  ];

  return (
    <section
      id="features"
      style={{
        padding: '6.5rem 1.5rem',
        background: '#ffffff',
        position: 'relative',
        borderTop: '1px solid rgba(22, 101, 52, 0.08)',
        borderBottom: '1px solid rgba(22, 101, 52, 0.08)',
        overflow: 'hidden'
      }}
    >
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
        {/* Section Header */}
        <ScrollReveal from="bottom" distance={50}>
          <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 4rem' }}>
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
              {t.features?.tag || 'CAPABILITIES'}
            </span>
            <h2
              className="font-serif"
              style={{
                fontSize: 'clamp(2.1rem, 4vw, 3.1rem)',
                fontWeight: 800,
                color: 'var(--color-green-dark)',
                lineHeight: 1.2,
                letterSpacing: '-0.02em'
              }}
            >
              {t.features?.heading || 'Everything You Need for Smarter Farming'}
            </h2>
          </div>
        </ScrollReveal>

        {/* 3 Main Cards Grid with Distinct Scroll Entrance Trajectories */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
            marginBottom: '2.5rem'
          }}
        >
          {mainFeatures.map((item, idx) => (
            <ScrollReveal
              key={idx}
              from={item.entrance}
              distance={100}
              delay={idx}
              threshold={0.42}
            >
              <div
                className="feature-clean-card"
                onClick={onNavigateToFeature}
                style={{
                  background: '#fbfaf6',
                  padding: '2.5rem 2rem',
                  borderRadius: '26px',
                  border: '1px solid rgba(22, 101, 52, 0.12)',
                  boxShadow: '0 4px 20px -2px rgba(15, 56, 30, 0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.28s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.28s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px) scale(1.01)';
                  e.currentTarget.style.boxShadow = '0 18px 40px -8px rgba(15, 56, 30, 0.14)';
                  e.currentTarget.style.borderColor = 'rgba(22, 101, 52, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 20px -2px rgba(15, 56, 30, 0.04)';
                  e.currentTarget.style.borderColor = 'rgba(22, 101, 52, 0.12)';
                }}
              >
                <div>
                  {/* Top Icon & Tag */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '16px',
                        background: item.bg,
                        border: `1px solid ${item.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.8rem',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        transition: 'transform 0.25s ease'
                      }}
                    >
                      {item.icon}
                    </div>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        color: 'var(--color-green-main)',
                        letterSpacing: '0.08em',
                        padding: '0.28rem 0.8rem',
                        borderRadius: 'var(--radius-full)',
                        background: 'rgba(22, 101, 52, 0.06)'
                      }}
                    >
                      {item.tag}
                    </span>
                  </div>

                  <h3
                    style={{
                      fontSize: '1.35rem',
                      fontWeight: 800,
                      color: 'var(--color-green-dark)',
                      marginBottom: '0.85rem',
                      letterSpacing: '-0.02em',
                      lineHeight: 1.3
                    }}
                  >
                    {item.title}
                  </h3>

                  <p
                    style={{
                      fontSize: '0.98rem',
                      color: '#4b5563',
                      lineHeight: 1.65
                    }}
                  >
                    {item.desc}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Voice Input Capability Banner (Enters from Bottom) */}
        <ScrollReveal from="bottom" distance={70} threshold={0.45}>
          <div
            style={{
              background: 'linear-gradient(135deg, #f0fdf4 0%, #fefce8 100%)',
              border: '1px solid rgba(22, 101, 52, 0.14)',
              borderRadius: '22px',
              padding: '1.4rem 2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              boxShadow: '0 4px 16px rgba(15, 56, 30, 0.04)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '14px',
                  background: '#ffffff',
                  border: '1px solid rgba(22, 101, 52, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.4rem',
                  flexShrink: 0,
                  boxShadow: '0 2px 8px rgba(15, 56, 30, 0.08)'
                }}
              >
                🎤
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--color-green-dark)' }}>
                  {t.features?.voice?.title || 'Voice Input'}
                </div>
                <div style={{ fontSize: '0.88rem', color: '#4b5563', marginTop: '2px' }}>
                  {t.features?.voice?.desc || 'Speak your farming question instead of typing.'}
                </div>
              </div>
            </div>

            <div
              style={{
                padding: '0.35rem 0.95rem',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(22, 101, 52, 0.08)',
                color: 'var(--color-green-dark)',
                fontSize: '0.82rem',
                fontWeight: 700
              }}
            >
              English • ಕನ್ನಡ • हिंदी
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
