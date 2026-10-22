import React, { useState } from 'react';
import { useTranslation } from '../i18n';
import ChatHistoryItem from './ChatHistoryItem';
import DeleteChatDialog from './DeleteChatDialog';

export default function ChatHistory({
  sessions = [],
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onClearAll,
  searchQuery,
  onSearchChange,
  loading,
  mobileOpen = false,
  onCloseMobile
}) {
  const { t } = useTranslation();
  const [deleteTarget, setDeleteTarget] = useState(null); // null | { type: 'single'|'all', id?: string }

  const handleSelect = (id) => {
    onSelectSession(id);
    if (onCloseMobile) onCloseMobile();
  };

  const handleCreateNew = () => {
    onNewChat();
    if (onCloseMobile) onCloseMobile();
  };

  const handleDeleteSingle = (sessionId) => {
    setDeleteTarget({ type: 'single', id: sessionId });
  };

  const handleClearAll = () => {
    setDeleteTarget({ type: 'all' });
  };

  const confirmDelete = async () => {
    if (deleteTarget?.type === 'single' && deleteTarget.id) {
      await onDeleteSession(deleteTarget.id);
    } else if (deleteTarget?.type === 'all') {
      await onClearAll();
    }
    setDeleteTarget(null);
  };

  // Group sessions by Today, Yesterday, and Older
  const groupSessions = (list) => {
    const today = [];
    const yesterday = [];
    const older = [];

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 86400000;

    list.forEach((session) => {
      let sessionTime = 0;
      try {
        if (session.created_at || session.updated_at) {
          sessionTime = new Date(session.updated_at || session.created_at).getTime();
        }
      } catch {
        sessionTime = 0;
      }

      if (sessionTime >= startOfToday) {
        today.push(session);
      } else if (sessionTime >= startOfYesterday) {
        yesterday.push(session);
      } else {
        older.push(session);
      }
    });

    return { today, yesterday, older };
  };

  const { today, yesterday, older } = groupSessions(sessions);

  const renderGroup = (title, items) => {
    if (!items || items.length === 0) return null;
    return (
      <div style={{ marginBottom: '0.85rem' }}>
        <div
          style={{
            fontSize: '0.72rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--color-green-main)',
            padding: '0.2rem 0.5rem 0.35rem'
          }}
        >
          {title}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {items.map((session) => (
            <ChatHistoryItem
              key={session.id}
              session={session}
              isActive={session.id === activeSessionId}
              onSelect={handleSelect}
              onDelete={handleDeleteSingle}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      {mobileOpen && (
        <div
          className="chat-history-backdrop"
          onClick={onCloseMobile}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(4px)',
            zIndex: 900
          }}
        />
      )}

      <aside
        className={`chat-history-sidebar ${mobileOpen ? 'mobile-open' : ''}`}
        style={{
          width: '280px',
          flexShrink: 0,
          background: 'rgba(255, 255, 255, 0.96)',
          borderRight: '1px solid rgba(22, 101, 52, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          transition: 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Top Header & + New Chat Button */}
        <div style={{ padding: '0.9rem 1rem 0.75rem', borderBottom: '1px solid var(--border-light)' }}>
          {/* Mobile close button row */}
          <div className="mobile-history-header-row" style={{ display: 'none', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--color-green-dark)' }}>
              💬 {t.chat?.historyTitle || 'Chat History'}
            </span>
            <button
              type="button"
              onClick={onCloseMobile}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748b',
                fontSize: '0.85rem'
              }}
            >
              ✕
            </button>
          </div>

          {/* + New Chat Button */}
          <button
            type="button"
            onClick={handleCreateNew}
            style={{
              width: '100%',
              padding: '0.65rem 1rem',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)',
              border: 'none',
              color: '#ffffff',
              fontSize: '0.88rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
              boxShadow: '0 2px 8px rgba(27, 94, 32, 0.22)',
              transition: 'all 0.2s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(27, 94, 32, 0.32)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(27, 94, 32, 0.22)';
            }}
          >
            <span>{t.chat?.newChatBtn || '+ New Chat'}</span>
          </button>

        {/* Search Conversations Input */}
        <div style={{ marginTop: '0.65rem', position: 'relative' }}>
          <input
            type="text"
            placeholder={t.chat.searchPlaceholder || 'Search conversations...'}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem 0.85rem 0.5rem 2rem',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              background: '#f8fafc',
              fontSize: '0.82rem',
              color: '#334155'
            }}
          />
          <span
            style={{
              position: 'absolute',
              left: '0.65rem',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '0.85rem',
              color: '#94a3b8',
              pointerEvents: 'none'
            }}
          >
            🔍
          </span>
        </div>
      </div>

      {/* Sessions Scrollable List Grouped by Date */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0.75rem 0.65rem',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {sessions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
            <div style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>💬</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#475569', marginBottom: '0.2rem' }}>
              {t.chat.noHistory || 'No conversations yet'}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
              {t.chat.noHistorySub || 'Start a conversation to see your history here.'}
            </div>
          </div>
        ) : (
          <>
            {renderGroup(t.chat.today || 'Today', today)}
            {renderGroup(t.chat.yesterday || 'Yesterday', yesterday)}
            {renderGroup(t.chat.older || 'Older', older)}
          </>
        )}
      </div>

      {/* Clear All History Footer Button */}
      {sessions.length > 0 && (
        <div style={{ padding: '0.65rem 0.75rem', borderTop: '1px solid var(--border-light)', textAlign: 'center' }}>
          <button
            type="button"
            onClick={handleClearAll}
            style={{
              width: '100%',
              padding: '0.45rem 0.75rem',
              borderRadius: '8px',
              color: '#dc2626',
              fontSize: '0.78rem',
              fontWeight: 600,
              background: '#fef2f2',
              border: '1px solid #fee2e2',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#fee2e2';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#fef2f2';
            }}
          >
            🗑️ {t.chat.clearAll || 'Clear all history'}
          </button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteChatDialog
        isOpen={Boolean(deleteTarget)}
        type={deleteTarget?.type || 'single'}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </aside>
  </>
  );
}
