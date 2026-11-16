import React from 'react';
import assetPath from '../utils/assetPath';

export default function LoadingState({ message = 'Loading...', full = false }) {
  if (full) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2.5rem 1.5rem',
          gap: '1rem'
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: '#ffffff',
            border: '1px solid rgba(22, 101, 52, 0.16)',
            boxShadow: '0 4px 14px rgba(22, 101, 52, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px',
            animation: 'pulseGlow 2s infinite ease-in-out'
          }}
        >
          <img
            src={assetPath("/images/agriai-emblem-transparent.png")}
            alt="AgriAI Loading"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>
        <div style={{ fontSize: '0.9rem', color: '#166534', fontWeight: 700 }}>
          {message}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.65rem',
        padding: '0.45rem 1rem 0.45rem 0.55rem',
        background: '#ffffff',
        border: '1px solid rgba(22, 101, 52, 0.16)',
        borderRadius: 'var(--radius-full)',
        color: '#166534',
        fontSize: '0.86rem',
        fontWeight: 700,
        boxShadow: '0 2px 8px rgba(15, 56, 30, 0.05)'
      }}
    >
      <div
        style={{
          width: '22px',
          height: '22px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'pulseGlow 1.8s infinite ease-in-out'
        }}
      >
        <img
          src={assetPath("/images/agriai-emblem-transparent.png")}
          alt="AgriAI"
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      </div>
      <span>{message}</span>
    </div>
  );
}
