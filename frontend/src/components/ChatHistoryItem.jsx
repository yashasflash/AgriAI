import React, { useState } from 'react';

export default function ChatHistoryItem({ session, isActive, onSelect, onDelete }) {
  const [isHovered, setIsHovered] = useState(false);

  // Format date / timestamp safely
  let timeLabel = '';
  try {
    if (session.updated_at || session.created_at) {
      const d = new Date(session.updated_at || session.created_at);
      timeLabel = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  } catch {
    timeLabel = '';
  }

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect(session.id)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.6rem 0.75rem',
        borderRadius: '12px',
        background: isActive ? '#e8f5e9' : (isHovered ? '#f1f5f9' : 'transparent'),
        border: isActive ? '1px solid #c8e6c9' : '1px solid transparent',
        cursor: 'pointer',
        gap: '0.5rem',
        transition: 'all 0.18s ease'
      }}
    >
      <div style={{ overflow: 'hidden', flex: 1 }}>
        <div
          style={{
            fontSize: '0.85rem',
            fontWeight: isActive ? 700 : 500,
            color: isActive ? '#1b5e20' : '#1e293b',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {session.title || 'Farming Conversation'}
        </div>
        {timeLabel && (
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.1rem' }}>
            {timeLabel}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
        {/* Delete button on hover */}
        {isHovered && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(session.id);
            }}
            title="Delete chat"
            style={{
              padding: '0.15rem 0.35rem',
              borderRadius: '4px',
              color: '#94a3b8',
              fontSize: '0.75rem',
              lineHeight: 1,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'color 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
          >
            ✕
          </button>
        )}

        {/* Small indicator arrow */}
        {isActive && (
          <span style={{ color: '#2e7d32', fontSize: '0.8rem', fontWeight: 800 }}>›</span>
        )}
      </div>
    </div>
  );
}
