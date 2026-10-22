import React, { useEffect, useRef } from 'react';
import { useTranslation } from '../i18n';

export default function VoiceIntelligenceBanner({ onTryVoice }) {
  const { t } = useTranslation();
  const canvasRef = useRef(null);

  // Realistic Moving Audio Waveform Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let step = 0;

    const resizeCanvas = () => {
      canvas.width = canvas.parentElement.offsetWidth || 500;
      canvas.height = canvas.parentElement.offsetHeight || 160;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const waves = [
      { color: 'rgba(34, 197, 94, 0.4)', speed: 0.035, amp: 28, freq: 0.015, offset: 0 },
      { color: 'rgba(163, 230, 53, 0.5)', speed: 0.045, amp: 22, freq: 0.02, offset: 2 },
      { color: 'rgba(20, 184, 166, 0.65)', speed: 0.025, amp: 34, freq: 0.012, offset: 4 },
      { color: 'rgba(56, 189, 248, 0.55)', speed: 0.05, amp: 18, freq: 0.025, offset: 1 }
    ];

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      waves.forEach((wave) => {
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = wave.color;

        for (let x = 0; x < width; x++) {
          // Attenuation towards edges so wave emerges smoothly from speaker to mic
          const envelope = Math.sin((x / width) * Math.PI);
          const y = centerY + Math.sin(x * wave.freq + step * wave.speed + wave.offset) * wave.amp * envelope;
          
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      });

      step += 1;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      className="voice-intelligence-banner"
      style={{
        position: 'relative',
        borderRadius: '24px',
        background: 'linear-gradient(135deg, #07170e 0%, #0d2818 50%, #061e14 100%)',
        border: '1px solid rgba(34, 197, 94, 0.25)',
        boxShadow: '0 12px 36px -6px rgba(15, 56, 30, 0.25)',
        padding: '2.25rem 2.5rem',
        color: '#ffffff',
        overflow: 'hidden',
        marginBottom: '2.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '2rem'
      }}
    >
      {/* Dynamic Animated Canvas Waves (Background/Right Flow) */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: '55%',
          pointerEvents: 'none',
          opacity: 0.85,
          zIndex: 1
        }}
      >
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      </div>

      {/* Ambient Glows */}
      <div
        style={{
          position: 'absolute',
          top: '-30%',
          right: '10%',
          width: '350px',
          height: '350px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(34, 197, 94, 0.22) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      {/* Left Copy & Badges */}
      <div style={{ position: 'relative', zIndex: 3, maxWidth: '640px' }}>
        {/* Real-time Voice Security / Intelligence Tag */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              letterSpacing: '0.08em',
              padding: '0.22rem 0.65rem',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(34, 197, 94, 0.18)',
              border: '1px solid rgba(34, 197, 94, 0.4)',
              color: '#86efac',
              textTransform: 'uppercase'
            }}
          >
            REAL-TIME VOICE ASSISTANT
          </span>
          <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600 }}>
            Offline Speech Intelligence
          </span>
        </div>

        {/* Main Headline */}
        <h3
          style={{
            fontSize: 'clamp(1.4rem, 2.5vw, 1.85rem)',
            fontWeight: 800,
            color: '#f8fafc',
            lineHeight: 1.28,
            marginBottom: '0.85rem',
            letterSpacing: '-0.02em'
          }}
        >
          Speak your farming questions naturally in English, Kannada, or Hindi.
        </h3>

        {/* Sub-quote */}
        <p
          style={{
            fontSize: '0.92rem',
            color: '#cbd5e1',
            lineHeight: 1.6,
            fontStyle: 'italic',
            marginBottom: '1.25rem'
          }}
        >
          "Offline speech recognition allowing hands-free farming queries — from crop recommendations to disease diagnosis right from your field."
        </p>

        {/* Bullet Specs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
            flexWrap: 'wrap',
            fontSize: '0.82rem',
            fontWeight: 700,
            color: '#86efac'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span>✦</span>
            <span>Offline Speech-to-Text</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span>•</span>
            <span>Zero Cloud Latency</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span>•</span>
            <span>Instant Audio Transcription</span>
          </div>
        </div>
      </div>

      {/* Right Action / Visual Focus */}
      <div
        style={{
          position: 'relative',
          zIndex: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.75rem'
        }}
      >
        <div
          style={{
            width: '68px',
            height: '68px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #166534 0%, #22c55e 100%)',
            border: '2px solid rgba(163, 230, 53, 0.6)',
            boxShadow: '0 0 25px rgba(34, 197, 94, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.8rem',
            color: '#ffffff',
            animation: 'pulseGlow 2.5s infinite'
          }}
        >
          🎤
        </div>
        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#a3e635', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          Live Audio Flow
        </span>
      </div>
    </div>
  );
}
