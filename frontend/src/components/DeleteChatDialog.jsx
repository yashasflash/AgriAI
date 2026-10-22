import React from 'react';
import { useTranslation } from '../i18n';

export default function DeleteChatDialog({ isOpen, type = 'single', onConfirm, onCancel }) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const isClearAll = type === 'all';
  const title = isClearAll ? t.chat.confirmClearTitle : t.chat.confirmDeleteTitle;
  const desc = isClearAll ? t.chat.confirmClearDesc : t.chat.confirmDeleteDesc;
  const actionBtn = isClearAll ? t.chat.deleteAll : t.chat.delete;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        background: 'rgba(0, 0, 0, 0.55)',
        backdropFilter: 'blur(6px)',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          background: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-light)',
          padding: '1.75rem',
          boxShadow: 'var(--shadow-hover)',
          animation: 'fadeUp 0.25s ease-out'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: '#fef2f2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              flexShrink: 0
            }}
          >
            ⚠️
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#111827' }}>
            {title}
          </h3>
        </div>

        <p style={{ fontSize: '0.92rem', color: '#4b5563', lineHeight: 1.55, marginBottom: '1.75rem' }}>
          {desc}
        </p>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '0.6rem 1.25rem',
              borderRadius: 'var(--radius-full)',
              border: '1px solid #d1d5db',
              background: '#f9fafb',
              color: '#374151',
              fontWeight: 600,
              fontSize: '0.88rem'
            }}
          >
            {t.chat.cancel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              padding: '0.6rem 1.35rem',
              borderRadius: 'var(--radius-full)',
              background: '#dc2626',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.88rem',
              boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)'
            }}
          >
            {actionBtn}
          </button>
        </div>
      </div>
    </div>
  );
}
