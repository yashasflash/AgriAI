import React from 'react';
import { useTranslation } from '../i18n';

export default function OfflineSection() {
  const { t } = useTranslation();

  return (
    <section
      id="offline"
      style={{
        padding: '6rem 1.5rem',
        background: 'var(--bg-page-alt)',
        borderTop: '1px solid var(--border-light)',
        borderBottom: '1px solid var(--border-light)'
      }}
    >
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 4rem' }}>
          <span
            style={{
              fontSize: '0.82rem',
              fontWeight: 800,
              letterSpacing: '0.08em',
              color: 'var(--color-green-main)',
              textTransform: 'uppercase',
              display: 'inline-block',
              marginBottom: '0.6rem'
            }}
          >
            {t.offline.tag}
          </span>
          <h2
            className="font-serif"
            style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 800,
              color: 'var(--color-green-dark)',
              lineHeight: 1.2,
              marginBottom: '1rem'
            }}
          >
            {t.offline.heading}
          </h2>
          <p style={{ fontSize: '1.08rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
            {t.offline.subtitle}
          </p>
        </div>

        {/* 4 Offline Pillars */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1.5rem',
            marginBottom: '3rem'
          }}
        >
          {t.offline.pillars.map((pillar, idx) => (
            <div
              key={idx}
              style={{
                background: '#ffffff',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--border-light)',
                padding: '2rem',
                boxShadow: 'var(--shadow-card)',
                transition: 'all var(--transition-normal)'
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'var(--color-green-subtle)',
                  color: 'var(--color-green-dark)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  marginBottom: '1.25rem'
                }}
              >
                {idx === 0 ? '🤖' : idx === 1 ? '📦' : idx === 2 ? '🔒' : '⚡'}
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-green-dark)', marginBottom: '0.5rem' }}>
                {pillar.title}
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                {pillar.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Disclaimer Note */}
        <div
          style={{
            maxWidth: '820px',
            margin: '0 auto',
            padding: '1rem 1.5rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-green-subtle)',
            border: '1px solid var(--border-green)',
            textAlign: 'center',
            fontSize: '0.85rem',
            color: 'var(--color-green-dark)',
            fontWeight: 600
          }}
        >
          ℹ️ {t.offline.disclaimer}
        </div>
      </div>
    </section>
  );
}
