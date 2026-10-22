import React from 'react';
import { useTranslation } from '../i18n';

export default function Architecture() {
  const { t } = useTranslation();

  return (
    <section
      id="architecture"
      style={{
        padding: '6rem 1.5rem',
        background: 'linear-gradient(180deg, #09170e 0%, #0c1c10 100%)',
        color: '#ffffff',
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
              color: '#a3e635',
              textTransform: 'uppercase',
              display: 'inline-block',
              marginBottom: '0.6rem'
            }}
          >
            {t.architecture.tag}
          </span>
          <h2
            className="font-serif"
            style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.2,
              marginBottom: '1rem'
            }}
          >
            {t.architecture.heading}
          </h2>
          <p style={{ fontSize: '1.05rem', color: '#94a3b8' }}>
            {t.architecture.subtitle}
          </p>
        </div>

        {/* Visual Architecture Flow Layout */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '2.5rem',
            alignItems: 'center'
          }}
        >
          {/* Level 1: User Inputs */}
          <div
            style={{
              width: '100%',
              maxWidth: '920px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 'var(--radius-xl)',
              padding: '1.75rem 2rem',
              backdropFilter: 'blur(12px)',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#a3e635', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
              👤 {t.architecture.userLayer}
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '1rem'
              }}
            >
              {t.architecture.userInputs.map((input, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(255, 255, 255, 0.07)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.85rem 1rem',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    color: '#f1f5f9'
                  }}
                >
                  {idx === 0 ? '📝 ' : idx === 1 ? '🎤 ' : idx === 2 ? '🧪 ' : '📸 '}
                  {input}
                </div>
              ))}
            </div>
          </div>

          {/* Connector Arrow */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '2px', height: '24px', background: 'linear-gradient(to bottom, #a3e635, #22c55e)' }} />
            <div style={{ color: '#a3e635', fontSize: '1.2rem', marginTop: '-6px' }}>▼</div>
          </div>

          {/* Level 2: React + Vite Frontend */}
          <div
            style={{
              width: '100%',
              maxWidth: '750px',
              background: 'linear-gradient(135deg, rgba(22, 101, 52, 0.5), rgba(15, 56, 30, 0.8))',
              border: '1px solid rgba(163, 230, 53, 0.4)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.25rem 2rem',
              textAlign: 'center',
              boxShadow: '0 0 20px rgba(163, 230, 53, 0.15)'
            }}
          >
            <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#ffffff' }}>
              ⚛️ {t.architecture.frontendLayer}
            </div>
            <div style={{ fontSize: '0.82rem', color: '#86efac', marginTop: '0.2rem' }}>
              Real-time state, i18n localization (EN / KN / HI), Web Speech API & responsive UI
            </div>
          </div>

          {/* Connector Arrow */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '2px', height: '24px', background: 'linear-gradient(to bottom, #22c55e, #10b981)' }} />
            <div style={{ color: '#10b981', fontSize: '1.2rem', marginTop: '-6px' }}>▼</div>
          </div>

          {/* Level 3: FastAPI Backend & Engine Core */}
          <div
            style={{
              width: '100%',
              maxWidth: '920px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 'var(--radius-xl)',
              padding: '2rem',
              backdropFilter: 'blur(14px)'
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
              <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#38bdf8' }}>
                ⚡ {t.architecture.backendLayer}
              </div>
              <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                High-speed local ASGI server routing endpoints directly to offline AI models
              </div>
            </div>

            {/* Endpoints & Target Models */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '1.25rem',
                marginBottom: '1.75rem'
              }}
            >
              <div style={{ background: 'rgba(0,0,0,0.35)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ color: '#38bdf8', fontFamily: 'monospace', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.4rem' }}>
                  POST /chat
                </div>
                <div style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
                  Routes to LM Studio (127.0.0.1:1234) running <strong>Phi-3 Mini</strong> LLM
                </div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.35)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ color: '#4ade80', fontFamily: 'monospace', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.4rem' }}>
                  POST /crop-recommendation
                </div>
                <div style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
                  Scikit-Learn <strong>Random Forest</strong> multi-class classifier
                </div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.35)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ color: '#fb923c', fontFamily: 'monospace', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.4rem' }}>
                  POST /leaf-disease
                </div>
                <div style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
                  TensorFlow & Keras <strong>MobileNetV2</strong> deep vision network
                </div>
              </div>
            </div>

            {/* Level 4: SQLite Local Storage */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem 1.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem'
              }}
            >
              <div>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>💾</span>
                  <span>{t.architecture.dbLayer}</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                  Zero cloud telemetry. Pure SQLite database stored in backend/data/agriai.db
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {t.architecture.dbItems.map((item, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      background: 'rgba(56, 189, 248, 0.15)',
                      color: '#7dd3fc',
                      padding: '0.25rem 0.65rem',
                      borderRadius: 'var(--radius-full)',
                      border: '1px solid rgba(56, 189, 248, 0.25)'
                    }}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
