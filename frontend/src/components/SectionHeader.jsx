import React from 'react';

export default function SectionHeader({ badge, title, subtitle, alignment = "center", light = false }) {
  return (
    <div style={{
      textAlign: alignment,
      marginBottom: '3rem',
      maxWidth: alignment === 'center' ? '800px' : '100%',
      margin: alignment === 'center' ? '0 auto 3rem' : '0 0 3rem'
    }}>
      {badge && (
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.35rem 0.9rem',
          borderRadius: 'var(--radius-full)',
          background: light ? 'rgba(255, 255, 255, 0.15)' : 'var(--color-green-subtle)',
          border: `1px solid ${light ? 'rgba(255, 255, 255, 0.3)' : 'var(--border-green)'}`,
          color: light ? '#ffffff' : 'var(--color-green-main)',
          fontSize: '0.82rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: '0.85rem'
        }}>
          <span>🌱</span>
          {badge}
        </div>
      )}

      <h2 className="font-serif" style={{
        fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
        fontWeight: 700,
        color: light ? '#ffffff' : 'var(--color-green-dark)',
        lineHeight: 1.2,
        letterSpacing: '-0.02em',
        marginBottom: subtitle ? '0.85rem' : 0
      }}>
        {title}
      </h2>

      {subtitle && (
        <p style={{
          fontSize: '1.05rem',
          color: light ? 'rgba(255, 255, 255, 0.85)' : 'var(--text-muted)',
          lineHeight: 1.6,
          maxWidth: '640px',
          margin: alignment === 'center' ? '0 auto' : 0
        }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
