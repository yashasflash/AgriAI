import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { useTranslation } from '../i18n';

const VoiceInput = forwardRef(function VoiceInput({ onSpeechResult, onError, onListeningChange }, ref) {
  const { language, t } = useTranslation();
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      // Set language according to active selected app language
      if (language === 'kn') {
        recognition.lang = 'kn-IN';
      } else if (language === 'hi') {
        recognition.lang = 'hi-IN';
      } else {
        recognition.lang = 'en-IN';
      }

      recognition.onstart = () => {
        setIsListening(true);
        if (onListeningChange) onListeningChange(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          onSpeechResult(transcript);
        }
        setIsListening(false);
        if (onListeningChange) onListeningChange(false);
      };

      recognition.onerror = (event) => {
        setIsListening(false);
        if (onListeningChange) onListeningChange(false);
        if (event.error === 'not-allowed') {
          onError(t.voice?.permissionDenied || 'Microphone access is needed for voice input.');
        } else if (event.error !== 'no-speech') {
          console.warn('Speech recognition notice:', event.error);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        if (onListeningChange) onListeningChange(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, [language, onSpeechResult, onError, onListeningChange, t]);

  const handleToggleVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      onError(t.voice?.unsupported || 'Voice input is not supported in this browser. Please type your question instead.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      if (onListeningChange) onListeningChange(false);
    } else {
      try {
        recognitionRef.current?.start();
      } catch (err) {
        console.warn('Speech recognition start error:', err);
      }
    }
  };

  useImperativeHandle(ref, () => ({
    toggleVoice: handleToggleVoice,
    isListening
  }));

  return (
    <button
      type="button"
      onClick={handleToggleVoice}
      title={isListening ? t.voice?.stopListening : (t.voice?.startListening || 'Voice Input')}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '38px',
        height: '38px',
        borderRadius: '50%',
        background: isListening ? '#ef4444' : 'rgba(0, 0, 0, 0.03)',
        color: isListening ? '#ffffff' : '#475569',
        border: isListening ? '2px solid #dc2626' : '1px solid rgba(0, 0, 0, 0.06)',
        fontSize: '1.1rem',
        cursor: 'pointer',
        animation: isListening ? 'pulseGlow 1.5s infinite' : 'none',
        transition: 'all 0.2s ease',
        flexShrink: 0
      }}
      onMouseEnter={(e) => {
        if (!isListening) {
          e.currentTarget.style.background = '#e8f5e9';
          e.currentTarget.style.color = '#1b5e20';
        }
      }}
      onMouseLeave={(e) => {
        if (!isListening) {
          e.currentTarget.style.background = 'rgba(0, 0, 0, 0.03)';
          e.currentTarget.style.color = '#475569';
        }
      }}
    >
      🎤
    </button>
  );
});

export default VoiceInput;
