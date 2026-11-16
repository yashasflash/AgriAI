import React from 'react';
import assetPath from '../utils/assetPath';

export default function ChatMessage({ sender, text, timestamp }) {
  const isUser = sender === 'user';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-start',
        gap: '0.75rem',
        animation: 'fadeUp 0.3s ease forwards'
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: '34px',
          height: '34px',
          borderRadius: '50%',
          background: isUser ? '#166534' : '#ffffff',
          border: isUser ? 'none' : '1px solid rgba(22, 101, 52, 0.16)',
          color: isUser ? '#ffffff' : 'inherit',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.95rem',
          flexShrink: 0,
          boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
          overflow: 'hidden',
          padding: isUser ? 0 : '2px'
        }}
      >
        {isUser ? (
          '👤'
        ) : (
          <img
            src={assetPath("/images/agriai-emblem-transparent.png")}
            alt="AgriAI"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        )}
      </div>

      {/* Message Bubble */}
      <div
        style={{
          maxWidth: '78%',
          background: isUser ? 'var(--color-green-dark)' : '#ffffff',
          color: isUser ? '#ffffff' : '#1e293b',
          border: isUser ? 'none' : '1px solid #e2e8f0',
          borderRadius: isUser ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
          padding: '0.9rem 1.25rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          lineHeight: 1.6,
          fontSize: '0.95rem',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word'
        }}
      >
        <div style={{ marginBottom: '0.2rem', fontSize: '0.74rem', opacity: isUser ? 0.75 : 0.6, fontWeight: 700 }}>
          {isUser ? 'You' : 'AgriAI'} • {timestamp || ''}
        </div>
        <div>{text}</div>
      </div>
    </div>
  );
}
