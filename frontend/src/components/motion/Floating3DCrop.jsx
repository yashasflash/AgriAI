import React, { useState, useEffect, useRef } from 'react';
import assetPath from '../../utils/assetPath';

/**
 * Floating3DCrop: A photorealistic agricultural seedling crop floating in 3D space.
 * Features organic slow 3D rotation, dynamic floating physics, inverse-scaling soft shadow,
 * interactive mouse parallax tilt, and scroll-linked upward diagonal trajectory.
 */
export default function Floating3DCrop({ scrollY = 0, isDesktop = true }) {
  const containerRef = useRef(null);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const [floatY, setFloatY] = useState(0);
  const [rotationAngle, setRotationAngle] = useState(0);

  // Organic slow floating & continuous slow 3D oscillation (1 full oscillation in ~18s)
  useEffect(() => {
    let animId = null;
    let startTime = performance.now();

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const animate = (currentTime) => {
      const elapsed = (currentTime - startTime) / 1000;

      // Vertical floating: 10px smooth harmonic wave
      const floatVal = Math.sin(elapsed * 1.3) * 11;
      setFloatY(floatVal);

      // Slow organic 3D rotation oscillation (-8° to +8°)
      const deg = Math.sin((elapsed * (Math.PI * 2)) / 18) * 9;
      setRotationAngle(deg);

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, []);

  // Mouse interaction parallax listener
  useEffect(() => {
    if (!isDesktop) return;

    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const normX = Math.max(-1, Math.min(1, (e.clientX - centerX) / (window.innerWidth / 2)));
      const normY = Math.max(-1, Math.min(1, (e.clientY - centerY) / (window.innerHeight / 2)));

      setMouseOffset({
        x: normX * 6, // max 6 deg tilt
        y: normY * 6
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isDesktop]);

  // Scroll-linked trajectory: as user scrolls down, crop glides diagonally upward, turns, and scales
  const scrollRatio = Math.min(scrollY / 500, 1.2);
  const scrollTranslateX = scrollRatio * 55; // moves 55px right
  const scrollTranslateY = -scrollRatio * 80; // moves 80px up
  const scrollRotateZ = scrollRatio * 12; // tilts 12 deg
  const scrollScale = 1 - scrollRatio * 0.1; // scales down slightly into depth

  // Dynamic shadow calculation (shadow gets wider & darker when crop is lower, smaller when higher)
  const shadowScale = 1 - (floatY / 11) * 0.15;
  const shadowOpacity = 0.32 + (floatY / 11) * 0.1;

  return (
    <div
      ref={containerRef}
      className="floating-3d-crop-container"
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '480px',
        height: '480px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        perspective: '1200px',
        transformStyle: 'preserve-3d',
        pointerEvents: 'auto'
      }}
    >
      {/* 1. Realistic Soft Dynamic Ground Shadow */}
      <div
        className="crop-ground-shadow"
        style={{
          position: 'absolute',
          bottom: '20px',
          width: '320px',
          height: '44px',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at center, rgba(15, 56, 30, 0.5) 0%, rgba(15, 56, 30, 0.18) 55%, rgba(0, 0, 0, 0) 75%)',
          filter: 'blur(12px)',
          transform: `scale(${shadowScale}) translate3d(${scrollTranslateX * 0.35}px, 0, 0)`,
          opacity: shadowOpacity,
          transition: 'transform 0.1s linear, opacity 0.1s linear',
          pointerEvents: 'none',
          zIndex: 1
        }}
      />

      {/* 2. Floating & Tilting 3D Crop Assembly */}
      <div
        className="crop-3d-wrapper"
        style={{
          position: 'relative',
          width: '360px',
          height: '380px',
          transformStyle: 'preserve-3d',
          transform: `
            translate3d(${scrollTranslateX}px, ${floatY + scrollTranslateY}px, 0)
            scale(${scrollScale})
            rotateX(${-mouseOffset.y * 0.75}deg)
            rotateY(${rotationAngle + mouseOffset.x * 0.75}deg)
            rotateZ(${scrollRotateZ}deg)
          `,
          transition: 'transform 0.12s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Soft atmospheric ambient backlight glow */}
        <div
          style={{
            position: 'absolute',
            top: '15%',
            left: '15%',
            width: '260px',
            height: '260px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(163, 230, 53, 0.25) 0%, rgba(34, 197, 94, 0.08) 55%, transparent 75%)',
            filter: 'blur(24px)',
            pointerEvents: 'none',
            zIndex: 0
          }}
        />

        {/* Photorealistic Isolated Crop Plant Image */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 5
          }}
        >
          <img
            src={assetPath("/images/real-crop-plant.png")}
            alt="Photorealistic Agricultural Crop Plant"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              filter: 'drop-shadow(0 16px 36px rgba(15, 56, 30, 0.22))',
              userSelect: 'none',
              pointerEvents: 'none'
            }}
          />
        </div>

        {/* Floating Health Status Badge */}
        <div
          style={{
            position: 'absolute',
            top: '20px',
            right: '-10px',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(22, 101, 52, 0.16)',
            borderRadius: '16px',
            padding: '0.65rem 1.05rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            boxShadow: '0 12px 28px -4px rgba(15, 56, 30, 0.18)',
            transform: `translate3d(0, ${-floatY * 0.35}px, 20px)`,
            transition: 'transform 0.1s linear',
            zIndex: 10
          }}
        >
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: '#dcfce7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.95rem'
            }}
          >
            🌱
          </div>
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f381e', lineHeight: 1.15 }}>
              Crop Health
            </div>
            <div style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: 700, marginTop: '1px' }}>
              ● 98% Optimal Vitality
            </div>
          </div>
        </div>

        {/* Floating Soil Chemistry Metric Pill */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            left: '-15px',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(22, 101, 52, 0.16)',
            borderRadius: '16px',
            padding: '0.6rem 0.95rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.55rem',
            boxShadow: '0 12px 28px -4px rgba(15, 56, 30, 0.16)',
            transform: `translate3d(0, ${floatY * 0.3}px, 15px)`,
            transition: 'transform 0.1s linear',
            zIndex: 10
          }}
        >
          <span style={{ fontSize: '1.05rem' }}>🧪</span>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0f381e' }}>
              Soil Nutrients Ready
            </div>
            <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>
              pH 6.5 Balanced
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
