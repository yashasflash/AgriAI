import React from 'react';
import { useTranslation } from '../i18n';

export default function Problem() {
  const { t } = useTranslation();

  return (
    <section
      id="problem"
      style={{
        padding: '6rem 1.5rem',
        background: 'var(--bg-page-alt)',
        borderTop: '1px solid var(--border-light)',
        borderBottom: '1px solid var(--border-light)'
      }}
    >
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto 4rem' }}>
          <span
            style={{
              fontSize: '0.82rem',
              fontWeight: 800,
              letterSpacing: '0.08em',
              color: '#dc2626',
              textTransform: 'uppercase',
              display: 'inline-block',
              marginBottom: '0.6rem'
            }}
          >
            {t.problem.tag}
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
            {t.problem.heading}
          </h2>
          <p style={{ fontSize: '1.05rem', color: 'var(--text-muted)' }}>
            {t.problem.subtitle}
          </p>
        </div>

        {/* 5 Problem Cards Grid */}
        <div
          className="problem-cards-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem'
          }}
        >
          {t.problem.cards.map((card, idx) => (
            <div
              key={idx}
              style={{
                background: '#ffffff',
                padding: '2rem',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--border-light)',
                boxShadow: 'var(--shadow-card)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all var(--transition-normal)'
              }}
            >
              <div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: '#fef2f2',
                    color: '#dc2626',
                    fontWeight: 900,
                    fontSize: '1rem',
                    marginBottom: '1.25rem',
                    border: '1px solid #fecaca'
                  }}
                >
                  {card.num}
                </div>
                <h3
                  style={{
                    fontSize: '1.18rem',
                    fontWeight: 800,
                    color: 'var(--color-green-dark)',
                    lineHeight: 1.35,
                    marginBottom: '0.75rem'
                  }}
                >
                  {card.title}
                </h3>
              </div>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                {card.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
