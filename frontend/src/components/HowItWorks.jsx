import React, { useRef } from 'react';
import { useTranslation } from '../i18n';
import { useElementScroll } from '../hooks/useScrollProgress';
import ScrollReveal from './motion/ScrollReveal';

export default function HowItWorks() {
  const { t } = useTranslation();
  const sectionRef = useRef(null);
  const { progress } = useElementScroll(sectionRef);

  const steps = t.howItWorks?.steps || [
    {
      num: "01",
      step: "ASK",
      icon: "💬",
      title: "Ask your farming question",
      desc: "Ask your farming question."
    },
    {
      num: "02",
      step: "SHARE",
      icon: "📷 🌱 🎤",
      title: "Share details",
      desc: "Give AgriAI the information it needs."
    },
    {
      num: "03",
      step: "ANALYZE",
      icon: "🧠",
      title: "Intelligent analysis",
      desc: "AgriAI analyzes your information."
    },
    {
      num: "04",
      step: "GET ANSWERS",
      icon: "💡",
      title: "Get clear answers",
      desc: "Get clear farming guidance."
    },
    {
      num: "05",
      step: "TAKE ACTION",
      icon: "🌾",
      title: "Take action",
      desc: "Use the guidance for your next farming decision."
    }
  ];

  // Calculate flow progress percentage [0% to 100%] linked to scroll
  const lineFillPercent = Math.min(100, Math.max(0, (progress - 0.2) * 200));

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      style={{
        padding: '6.5rem 1.5rem',
        background: '#fbfaf6',
        borderTop: '1px solid rgba(22, 101, 52, 0.08)',
        borderBottom: '1px solid rgba(22, 101, 52, 0.08)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div style={{ maxWidth: '1320px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Section Header */}
        <ScrollReveal from="bottom" distance={50}>
          <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 4.5rem' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.35rem 0.95rem',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(22, 101, 52, 0.08)',
                border: '1px solid rgba(22, 101, 52, 0.15)',
                color: 'var(--color-green-main)',
                fontSize: '0.8rem',
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: '0.85rem'
              }}
            >
              <span>🌾</span>
              <span>{t.howItWorks?.tag || 'HOW AGRIAI WORKS'}</span>
            </div>

            <h2
              className="font-serif"
              style={{
                fontSize: 'clamp(2.1rem, 4vw, 3.1rem)',
                fontWeight: 800,
                color: 'var(--color-green-dark)',
                lineHeight: 1.18,
                marginBottom: '0.85rem',
                letterSpacing: '-0.02em'
              }}
            >
              {t.howItWorks?.heading || 'How AgriAI Works'}
            </h2>

            <p
              style={{
                fontSize: '1.1rem',
                color: 'var(--text-muted)',
                lineHeight: 1.6,
                fontWeight: 450
              }}
            >
              {t.howItWorks?.subtitle || 'Simple steps. Smarter farming decisions.'}
            </p>
          </div>
        </ScrollReveal>

        {/* 5-Step Horizontal Flow with Scroll-Linked Connector */}
        <div className="how-it-works-flow-wrapper" style={{ position: 'relative' }}>
          {/* Animated Connecting Progress Line (Desktop) */}
          <div
            style={{
              position: 'absolute',
              top: '90px',
              left: '5%',
              right: '5%',
              height: '3px',
              background: '#e2e8f0',
              borderRadius: '2px',
              zIndex: 0
            }}
            className="flow-connecting-line-desktop"
          >
            <div
              style={{
                width: `${lineFillPercent}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #166534, #22c55e, #a3e635)',
                borderRadius: '2px',
                transition: 'width 0.1s linear'
              }}
            />
          </div>

          {/* 5 Progressively Flowing Cards */}
          <div className="how-it-works-cards-grid">
            {steps.map((item, idx) => (
              <ScrollReveal
                key={idx}
                from="bottom"
                distance={70}
                delay={idx}
                threshold={0.35}
              >
                <div
                  className="how-step-card"
                  style={{
                    background: '#ffffff',
                    padding: '2rem 1.4rem',
                    borderRadius: '22px',
                    border: '1px solid rgba(22, 101, 52, 0.12)',
                    boxShadow: '0 4px 16px rgba(15, 56, 30, 0.04)',
                    height: '100%',
                    position: 'relative',
                    transition: 'transform 0.25s ease, box-shadow 0.25s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 14px 28px -6px rgba(15, 56, 30, 0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(15, 56, 30, 0.04)';
                  }}
                >
                  {/* Step Badge & Ghost Number */}
                  <div className="step-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        color: 'var(--color-green-main)',
                        background: 'var(--color-green-subtle)',
                        padding: '0.2rem 0.65rem',
                        borderRadius: 'var(--radius-full)',
                        letterSpacing: '0.06em'
                      }}
                    >
                      {item.step}
                    </span>
                    <span style={{ fontSize: '1.4rem', fontWeight: 900, color: 'rgba(15, 56, 30, 0.12)' }}>
                      {item.num}
                    </span>
                  </div>

                  {/* Icon Node */}
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '14px',
                      background: 'rgba(22, 101, 52, 0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.4rem',
                      marginBottom: '1rem'
                    }}
                  >
                    <span>{item.icon}</span>
                  </div>

                  {/* Step Title */}
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-green-dark)', marginBottom: '0.45rem', lineHeight: 1.3 }}>
                    {item.title}
                  </h3>

                  {/* Step Description */}
                  <p style={{ fontSize: '0.86rem', color: '#4b5563', lineHeight: 1.55 }}>
                    {item.desc}
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
