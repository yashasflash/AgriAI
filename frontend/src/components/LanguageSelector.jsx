import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../i18n';

export default function LanguageSelector({ variant = 'default' }) {
  const { language, setLanguage } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const languages = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
    { code: 'hi', label: 'Hindi', native: 'हिंदी' },
  ];

  const currentLang = languages.find((l) => l.code === language) || languages[0];

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isDark = variant === 'dark';

  return (
    <div className="language-selector-wrapper" ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select Language"
        aria-expanded={isOpen}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.45rem',
          padding: '0.42rem 0.85rem',
          borderRadius: 'var(--radius-full)',
          background: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.85)',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.22)' : '1px solid rgba(15, 56, 30, 0.12)',
          color: isDark ? '#ffffff' : 'var(--color-green-dark)',
          fontSize: '0.84rem',
          fontWeight: 600,
          cursor: 'pointer',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          boxShadow: isDark ? 'none' : '0 2px 6px rgba(15, 56, 30, 0.04)',
          transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(22, 101, 52, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(15, 56, 30, 0.12)';
        }}
      >
        <span style={{ fontSize: '0.95rem', lineHeight: 1 }}>🌐</span>
        <span style={{ letterSpacing: '0.01em' }}>{currentLang.native}</span>
        <svg
          width="10"
          height="6"
          viewBox="0 0 10 6"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            opacity: 0.7
          }}
        >
          <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            zIndex: 1000,
            minWidth: '155px',
            background: 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '16px',
            border: '1px solid rgba(15, 56, 30, 0.1)',
            boxShadow: '0 12px 32px -4px rgba(15, 56, 30, 0.14), 0 4px 12px -2px rgba(15, 56, 30, 0.06)',
            padding: '0.4rem',
            animation: 'dropdownScale 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            transformOrigin: 'top right'
          }}
        >
          {languages.map((item) => {
            const isSelected = item.code === language;
            return (
              <button
                key={item.code}
                type="button"
                onClick={() => {
                  setLanguage(item.code);
                  setIsOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '0.55rem 0.85rem',
                  borderRadius: '10px',
                  background: isSelected ? 'var(--color-green-subtle)' : 'transparent',
                  color: isSelected ? 'var(--color-green-dark)' : '#334155',
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: '0.86rem',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = '#f1f5f9';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'transparent';
                }}
              >
                <span>{item.native}</span>
                {isSelected && (
                  <span style={{ color: 'var(--color-green-main)', fontSize: '0.88rem', fontWeight: 800 }}>
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
