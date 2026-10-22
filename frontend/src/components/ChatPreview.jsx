import React from 'react';
import { useTranslation } from '../i18n';

export default function ChatPreview({ onTryNow }) {
  const { t } = useTranslation();

  return (
    <section
      id="chat-preview"
      style={{
        padding: '6rem 1.5rem',
        background: 'var(--bg-page)',
        position: 'relative'
      }}
    >
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto 3.5rem' }}>
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
            {t.chatPreview.tag}
          </span>
          <h2
            className="font-serif"
            style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 800,
              color: 'var(--color-green-dark)',
              lineHeight: 1.2
            }}
          >
            {t.chatPreview.heading}
          </h2>
        </div>

        {/* Chatbot Preview Container Card */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-light)',
            boxShadow: 'var(--shadow-card)',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '1.25rem 2rem',
              background: 'linear-gradient(to right, #f8fafc, #f0fdf4)',
              borderBottom: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'var(--color-green-dark)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.1rem'
                }}
              >
                🌾
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.96rem', color: 'var(--color-green-dark)' }}>
                  AgriAI Farming Assistant
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Local Phi-3 Mini Intelligence
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.3rem 0.85rem',
                borderRadius: 'var(--radius-full)',
                background: 'var(--color-green-subtle)',
                border: '1px solid var(--border-green)',
                color: 'var(--color-green-dark)',
                fontSize: '0.8rem',
                fontWeight: 700
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#22c55e',
                  animation: 'pulseGlow 2s infinite'
                }}
              />
              Local AI Online
            </div>
          </div>

          {/* Messages Body */}
          <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* User Message */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div
                style={{
                  maxWidth: '75%',
                  background: 'var(--color-green-dark)',
                  color: '#ffffff',
                  padding: '1rem 1.4rem',
                  borderRadius: '18px 18px 4px 18px',
                  fontSize: '0.95rem',
                  boxShadow: '0 2px 8px rgba(15, 56, 30, 0.15)'
                }}
              >
                <div style={{ fontSize: '0.72rem', opacity: 0.8, marginBottom: '0.2rem', fontWeight: 600 }}>
                  Farmer
                </div>
                {t.chatPreview.farmerMsg}
              </div>
            </div>

            {/* AI Assistant Message */}
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div
                style={{
                  maxWidth: '82%',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  color: '#1e293b',
                  padding: '1.2rem 1.5rem',
                  borderRadius: '18px 18px 18px 4px',
                  fontSize: '0.95rem',
                  lineHeight: 1.6
                }}
              >
                <div style={{ fontSize: '0.72rem', color: 'var(--color-green-main)', fontWeight: 800, marginBottom: '0.3rem' }}>
                  AgriAI Assistant
                </div>
                {t.chatPreview.aiMsg}
              </div>
            </div>
          </div>

          {/* Interactive Footer Call to Action */}
          <div
            style={{
              padding: '1.25rem 2rem',
              background: '#f8fafc',
              borderTop: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem'
            }}
          >
            <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              {t.chatPreview.chipPrompt}
            </span>

            <button
              type="button"
              onClick={onTryNow}
              style={{
                padding: '0.6rem 1.4rem',
                borderRadius: 'var(--radius-full)',
                background: 'var(--color-green-dark)',
                color: '#ffffff',
                fontSize: '0.88rem',
                fontWeight: 700,
                boxShadow: '0 2px 10px rgba(15, 56, 30, 0.2)'
              }}
            >
              Launch Live Chatbot →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
