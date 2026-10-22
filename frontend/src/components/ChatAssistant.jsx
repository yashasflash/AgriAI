import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from '../i18n';
import ChatMessage from './ChatMessage';
import VoiceInput from './VoiceInput';
import LoadingState from './LoadingState';
import ChatHistory from './ChatHistory';
import {
  sendChatMessage,
  getChatHistory,
  getConversation,
  createNewChat,
  deleteConversation,
  clearChatHistory
} from '../services/api';

export default function ChatAssistant({ user, onSelectTab }) {
  const { language, t } = useTranslation();

  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [errorNotice, setErrorNotice] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);

  const messagesEndRef = useRef(null);
  const plusMenuRef = useRef(null);
  const voiceInputRef = useRef(null);

  // Close plus menu when clicked outside or on Escape
  useEffect(() => {
    const handleOutside = (e) => {
      if (plusMenuRef.current && !plusMenuRef.current.contains(e.target)) {
        setPlusMenuOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setPlusMenuOpen(false);
      }
    };
    if (plusMenuOpen) {
      document.addEventListener('mousedown', handleOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [plusMenuOpen]);

  // Smooth auto-scroll to bottom of conversation
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Load chat sessions from local SQLite DB
  const loadSessions = useCallback(async (query = '') => {
    if (!user) return;
    setHistoryLoading(true);
    try {
      const list = await getChatHistory(query);
      setSessions(list || []);
    } catch (err) {
      console.warn('Failed to load chat history:', err);
    } finally {
      setHistoryLoading(false);
    }
  }, [user]);

  // Initial load of history
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Debounced search within sessions
  useEffect(() => {
    const timer = setTimeout(() => {
      loadSessions(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, loadSessions]);

  // Load a specific conversation session
  const handleSelectSession = async (sessionId) => {
    if (!sessionId) return;
    setActiveSessionId(sessionId);
    setLoading(true);
    setErrorNotice(null);
    try {
      const data = await getConversation(sessionId);
      if (data && data.messages) {
        const formatted = [];
        data.messages.forEach((m) => {
          if (m.question) {
            formatted.push({
              id: `q_${m.id}`,
              sender: 'user',
              text: m.question,
              timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
          }
          if (m.answer) {
            formatted.push({
              id: `a_${m.id}`,
              sender: 'bot',
              text: m.answer,
              timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
          }
        });
        setMessages(formatted);
      }
    } catch (err) {
      console.warn('Failed to load conversation messages:', err);
      setErrorNotice(err.message || 'Failed to load conversation');
    } finally {
      setLoading(false);
    }
  };

  // Start a new empty chat
  const handleNewChat = async () => {
    setErrorNotice(null);
    setInput('');
    setActiveSessionId(null);
    setMessages([]);
  };

  // Delete single conversation
  const handleDeleteSession = async (sessionId) => {
    try {
      await deleteConversation(sessionId);
      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
        setMessages([]);
      }
      await loadSessions();
    } catch (err) {
      console.warn('Error deleting conversation:', err);
      setErrorNotice(err.message || 'Failed to delete conversation');
    }
  };

  // Clear all conversations
  const handleClearAll = async () => {
    try {
      await clearChatHistory();
      setActiveSessionId(null);
      setMessages([]);
      await loadSessions();
    } catch (err) {
      console.warn('Error clearing history:', err);
      setErrorNotice(err.message || 'Failed to clear chat history');
    }
  };

  // Core Send Logic
  const executeSend = async (questionText) => {
    const userQuestion = questionText.trim();
    if (!userQuestion || loading) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setInput('');
    setErrorNotice(null);

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: 'user',
        text: userQuestion,
        timestamp: timeStr
      }
    ]);
    setLoading(true);

    try {
      const data = await sendChatMessage(userQuestion, activeSessionId, language);
      const answer = data?.answer || "I have analyzed your query based on farming guidelines.";

      if (data?.session_id && (!activeSessionId || activeSessionId !== data.session_id)) {
        setActiveSessionId(data.session_id);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: answer,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);

      if (user) {
        await loadSessions();
      }
    } catch (err) {
      console.warn('Chat API error:', err);
      const errorMsg = t.chat?.serviceUnavailable || 'AgriAI is temporarily unavailable. Please make sure the local AI service is running.';
      setErrorNotice(errorMsg);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: errorMsg,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e?.preventDefault();
    executeSend(input);
  };

  const handleSuggestionClick = (question) => {
    executeSend(question);
  };

  const suggestionItems = [
    { icon: '🌱', text: t.chat?.sug1 || 'How do I grow rice?' },
    { icon: '🍃', text: t.chat?.sug2 || 'What fertilizer should I use?' },
    { icon: '🌿', text: t.chat?.sug3 || 'Why are my leaves turning yellow?' },
    { icon: '🌾', text: t.chat?.sug4 || 'Which crop is suitable for my soil?' }
  ];

  return (
    <div style={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Main Chat Box with Integrated History Sidebar & Warm Translucent Glass Surface */}
      <div
        className="chat-main-container"
        style={{
          background: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '26px',
          border: '1px solid rgba(22, 101, 52, 0.12)',
          boxShadow: '0 20px 48px -12px rgba(15, 56, 30, 0.08), 0 4px 16px -2px rgba(15, 56, 30, 0.04)',
          overflow: 'hidden',
          display: 'flex',
          height: '640px',
          minHeight: '480px',
          position: 'relative'
        }}
      >
        {/* Left: Persistent Chat History Sidebar */}
        <ChatHistory
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={handleSelectSession}
          onNewChat={handleNewChat}
          onDeleteSession={handleDeleteSession}
          onClearAll={handleClearAll}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          loading={historyLoading}
          mobileOpen={mobileHistoryOpen}
          onCloseMobile={() => setMobileHistoryOpen(false)}
        />

        {/* Right: AI Farming Assistant Conversation Area */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            minWidth: 0,
            background: 'rgba(253, 252, 248, 0.65)'
          }}
        >
          {/* Clean Chat Header (Farmer Centered) */}
          <div
            style={{
              padding: '0.85rem 1.5rem',
              background: 'rgba(255, 255, 255, 0.92)',
              borderBottom: '1px solid rgba(22, 101, 52, 0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '0.75rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '12px',
                  background: '#ffffff',
                  border: '1px solid rgba(22, 101, 52, 0.16)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '2px',
                  boxShadow: '0 2px 8px rgba(15, 56, 30, 0.12)',
                  flexShrink: 0,
                  overflow: 'hidden'
                }}
              >
                <img
                  src="/images/agriai-emblem-transparent.png"
                  alt="AgriAI Assistant"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: '#166534', lineHeight: 1.2 }}>
                  {t.chat?.title || 'AI Farming Assistant'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.74rem', color: '#16a34a', fontWeight: 700, marginTop: '1px' }}>
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#22c55e',
                      display: 'inline-block'
                    }}
                  />
                  <span>{t.chat?.statusOnline || '● Local AI Online'}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              {/* Listening Indicator when Voice active */}
              {isVoiceListening && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.3rem 0.8rem',
                    borderRadius: 'var(--radius-full)',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#dc2626',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    animation: 'pulseGlow 1.5s infinite'
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#dc2626' }} />
                  <span>{t.voice?.listening || 'Listening...'}</span>
                </div>
              )}

              {/* Mobile History Drawer Toggle */}
              <button
                type="button"
                onClick={() => setMobileHistoryOpen(!mobileHistoryOpen)}
                className="mobile-history-toggle-btn"
                title={t.chat?.historyTitle || 'Chat History'}
                style={{
                  display: 'none',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.38rem 0.85rem',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--color-green-subtle)',
                  border: '1px solid var(--border-green)',
                  color: 'var(--color-green-dark)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <span>💬</span>
                <span>{t.chat?.historyTitle || 'History'}</span>
              </button>
            </div>
          </div>

          {/* Scrollable Conversation Stream */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}
          >
            {/* Empty State: Centered Greeting & Friendly Suggestion Chips */}
            {messages.length === 0 ? (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  padding: '1.5rem 1.5rem',
                  maxWidth: '640px',
                  margin: 'auto'
                }}
              >
                <div
                  style={{
                    width: '68px',
                    height: '68px',
                    borderRadius: '22px',
                    background: '#ffffff',
                    border: '1.5px solid rgba(22, 101, 52, 0.16)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '6px',
                    marginBottom: '1.25rem',
                    boxShadow: '0 8px 24px rgba(27, 94, 32, 0.14)',
                    overflow: 'hidden'
                  }}
                >
                  <img
                    src="/images/agriai-emblem-transparent.png"
                    alt="AgriAI Assistant"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </div>

                <h2
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '1.55rem',
                    fontWeight: 800,
                    color: '#0f381e',
                    letterSpacing: '-0.02em',
                    marginBottom: '0.45rem'
                  }}
                >
                  {t.chat?.emptyTitle || 'How can I help with your farming?'}
                </h2>

                <p
                  style={{
                    color: '#64748b',
                    fontSize: '0.92rem',
                    lineHeight: 1.55,
                    marginBottom: '1.75rem',
                    maxWidth: '480px'
                  }}
                >
                  {t.chat?.emptySubtitle || 'Ask me about crops, soil, plant health, pests, fertilizers, or everyday farming questions.'}
                </p>

                {/* 2x2 Suggestion Cards Grid matching Reference Image */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '0.75rem',
                    width: '100%',
                    maxWidth: '580px'
                  }}
                >
                  {suggestionItems.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSuggestionClick(item.text)}
                      style={{
                        padding: '0.85rem 1rem',
                        borderRadius: '16px',
                        background: '#ffffff',
                        border: '1px solid rgba(22, 101, 52, 0.12)',
                        color: '#1e293b',
                        fontSize: '0.86rem',
                        fontWeight: 600,
                        textAlign: 'left',
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.65rem'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#16a34a';
                        e.currentTarget.style.background = '#f0fdf4';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(22, 101, 52, 0.08)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(22, 101, 52, 0.12)';
                        e.currentTarget.style.background = '#ffffff';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.02)';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                        <span style={{ fontSize: '1rem', flexShrink: 0 }}>{item.icon}</span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.text}
                        </span>
                      </div>
                      <span style={{ color: '#16a34a', fontSize: '0.9rem', fontWeight: 700, flexShrink: 0 }}>→</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  sender={msg.sender}
                  text={msg.text}
                  timestamp={msg.timestamp}
                />
              ))
            )}

            {/* Thinking Indicator */}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start', margin: '0.25rem 0' }}>
                <LoadingState message={t.chat?.thinking || "AgriAI is thinking..."} />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Backend Error Alert */}
          {errorNotice && (
            <div
              style={{
                padding: '0.65rem 1.25rem',
                background: '#fef2f2',
                borderTop: '1px solid #fecaca',
                color: '#b91c1c',
                fontSize: '0.84rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span>⚠️ {errorNotice}</span>
              <button
                type="button"
                onClick={() => setErrorNotice(null)}
                style={{ color: '#b91c1c', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
          )}

          {/* Farmer-Friendly Bottom Input Form (Unified Rounded Pill Bar) */}
          <form
            onSubmit={handleFormSubmit}
            style={{
              padding: '0.75rem 1.15rem 0.95rem',
              background: 'rgba(255, 255, 255, 0.95)',
              borderTop: '1px solid rgba(22, 101, 52, 0.08)',
              position: 'relative'
            }}
          >
            <div
              className="chat-input-pill-container"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: '#ffffff',
                border: '1.5px solid rgba(22, 101, 52, 0.16)',
                borderRadius: 'var(--radius-full)',
                padding: '0.35rem 0.45rem 0.35rem 0.55rem',
                boxShadow: '0 2px 10px rgba(15, 56, 30, 0.04)',
                position: 'relative',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
              }}
            >
              {/* Quick Tool '+' Action Popover Menu */}
              <div ref={plusMenuRef} style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setPlusMenuOpen(!plusMenuOpen)}
                  title="Quick Tools (+)"
                  aria-label="Quick Tools Menu"
                  aria-expanded={plusMenuOpen}
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: plusMenuOpen ? '#1b5e20' : '#e8f5e9',
                    color: plusMenuOpen ? '#ffffff' : '#1b5e20',
                    border: '1px solid rgba(27, 94, 32, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.35rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transform: plusMenuOpen ? 'rotate(45deg)' : 'none',
                    transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: plusMenuOpen ? '0 4px 12px rgba(15, 56, 30, 0.2)' : 'none',
                    flexShrink: 0
                  }}
                >
                  +
                </button>

                {/* Clean Popover Modal */}
                {plusMenuOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 'calc(100% + 12px)',
                      left: 0,
                      width: '210px',
                      background: 'rgba(255, 255, 255, 0.98)',
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      border: '1px solid rgba(22, 101, 52, 0.16)',
                      borderRadius: '18px',
                      padding: '0.45rem',
                      boxShadow: '0 14px 36px -4px rgba(15, 56, 30, 0.18)',
                      zIndex: 100,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem',
                      animation: 'dropdownScale 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards'
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setPlusMenuOpen(false);
                        if (onSelectTab) onSelectTab('crop');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                        padding: '0.6rem 0.85rem',
                        borderRadius: '12px',
                        background: 'transparent',
                        border: 'none',
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        color: 'var(--color-green-dark)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--color-green-subtle)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <span style={{ fontSize: '1.1rem' }}>🌱</span>
                      <span>{t.dashboard?.tabCrop || 'Crop Advisory'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPlusMenuOpen(false);
                        if (onSelectTab) onSelectTab('leaf');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                        padding: '0.6rem 0.85rem',
                        borderRadius: '12px',
                        background: 'transparent',
                        border: 'none',
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        color: 'var(--color-green-dark)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--color-green-subtle)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <span style={{ fontSize: '1.1rem' }}>🍃</span>
                      <span>{t.dashboard?.tabLeaf || 'Leaf Health'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPlusMenuOpen(false);
                        voiceInputRef.current?.toggleVoice();
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                        padding: '0.6rem 0.85rem',
                        borderRadius: '12px',
                        background: 'transparent',
                        border: 'none',
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        color: 'var(--color-green-dark)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--color-green-subtle)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <span style={{ fontSize: '1.1rem' }}>🎤</span>
                      <span>{t.features?.voice?.title || 'Voice Input'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Input Text Field */}
              <input
                type="text"
                placeholder={t.chat?.placeholder || 'Ask anything about farming...'}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '0.6rem 0.75rem',
                  borderRadius: 'var(--radius-full)',
                  border: 'none',
                  background: 'transparent',
                  fontSize: '0.94rem',
                  color: '#0f172a',
                  outline: 'none',
                  minWidth: 0
                }}
              />

              {/* Voice Input Microphone Button */}
              <VoiceInput
                ref={voiceInputRef}
                onSpeechResult={(spokenText) => setInput(spokenText)}
                onError={(msg) => setErrorNotice(msg)}
                onListeningChange={setIsVoiceListening}
              />

              {/* Circular Green Send Button matching Reference Image */}
              <button
                type="submit"
                disabled={loading || !input.trim()}
                aria-label="Send Message"
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: input.trim() && !loading ? 'linear-gradient(135deg, #1b5e20, #2e7d32)' : '#cbd5e1',
                  color: '#ffffff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: input.trim() && !loading ? '0 4px 12px rgba(27, 94, 32, 0.28)' : 'none',
                  cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                  border: 'none',
                  flexShrink: 0,
                  fontSize: '0.95rem',
                  transition: 'all 0.2s ease'
                }}
              >
                <span style={{ transform: 'translateX(1px)' }}>➤</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
