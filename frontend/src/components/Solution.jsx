import React from 'react';
import { useTranslation } from '../i18n';

export default function Solution() {
  const { t } = useTranslation();

  return (
    <section
      id="solution"
      style={{
        padding: '6rem 1.5rem',
        background: 'var(--bg-page)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 4.5rem' }}>
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
            {t.solution.tag}
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
            {t.solution.heading}
          </h2>
          <p style={{ fontSize: '1.05rem', color: 'var(--text-muted)' }}>
            {t.solution.subtitle}
          </p>
        </div>

        {/* Central Connected Diagram */}
        <div
          className="solution-hub-container"
          style={{
            position: 'relative',
            background: 'linear-gradient(135deg, #09170e, #0f381e)',
            borderRadius: 'var(--radius-xl)',
            padding: '4rem 2rem',
            color: '#ffffff',
            boxShadow: 'var(--shadow-hover)',
            border: '1px solid rgba(255,255,255,0.1)',
            overflow: 'hidden'
          }}
        >
          {/* Subtle Ambient Hub Glow */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '450px',
              height: '450px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(163, 230, 53, 0.15) 0%, rgba(0,0,0,0) 70%)',
              pointerEvents: 'none'
            }}
          />

          {/* Center Hub Badge */}
          <div
            style={{
              textAlign: 'center',
              maxWidth: '320px',
              margin: '0 auto 3rem',
              padding: '1.5rem',
              borderRadius: 'var(--radius-lg)',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(163, 230, 53, 0.4)',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 0 25px rgba(163, 230, 53, 0.25)',
              position: 'relative',
              zIndex: 5
            }}
          >
            <div style={{ fontSize: '2.4rem', marginBottom: '0.4rem' }}>🌾</div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#f0fdf4', letterSpacing: '-0.01em' }}>
              {t.solution.centerTitle}
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#a3e635', fontWeight: 600 }}>
              {t.solution.centerDesc}
            </p>
          </div>

          {/* Connected Feature Nodes Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1.5rem',
              position: 'relative',
              zIndex: 5
            }}
          >
            {t.solution.nodes.map((node, idx) => (
              <div
                key={idx}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.5rem',
                  backdropFilter: 'blur(10px)',
                  transition: 'all var(--transition-normal)'
                }}
              >
                <div
                  style={{
                    fontSize: '1.8rem',
                    marginBottom: '0.75rem',
                    display: 'inline-block'
                  }}
                >
                  {node.icon}
                </div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.4rem' }}>
                  {node.title}
                </h4>
                <p style={{ fontSize: '0.84rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                  {node.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
