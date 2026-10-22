import React, { useEffect, useState } from 'react';
import { useScrollProgress } from '../../hooks/useScrollProgress';

/**
 * CinematicFallingLeaf: A subtle, natural, photorealistic leaf that gently
 * drifts through the outer visual space during the Hero -> About transition.
 * 
 * - Modest size (100-140px on desktop)
 * - Subtle rotation (max +/- 6 deg, no spinning)
 * - Traverses outer visual margins, never obstructing text or buttons
 * - 100% scroll-linked with buttery lerp reverse motion
 */
export default function CinematicFallingLeaf() {
  const { scrollY } = useScrollProgress();
  const [windowDimensions, setWindowDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800
  });
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const motionHandler = () => setReducedMotion(mq.matches);

    window.addEventListener('resize', handleResize, { passive: true });
    mq.addEventListener('change', motionHandler);

    return () => {
      window.removeEventListener('resize', handleResize);
      mq.removeEventListener('change', motionHandler);
    };
  }, []);

  if (reducedMotion) return null;

  const { width: winW, height: winH } = windowDimensions;
  const isDesktop = winW >= 1024;
  const isTablet = winW >= 640 && winW < 1024;

  // Modest, non-intrusive size (100-140px on desktop, 75-90px on mobile)
  const leafWidth = isDesktop ? 125 : (isTablet ? 100 : 75);

  // The leaf travels across the first 1400px of scroll (Hero -> About transition)
  const journeyDistance = 1400;
  const progress = Math.max(0, Math.min(1.1, scrollY / journeyDistance));

  // Exit early when out of view to save GPU cycles
  if (progress <= 0 || progress >= 1.05) return null;

  // 1. Vertical smooth descent (starts slightly above viewport, exits below)
  const startY = -leafWidth - 10;
  const totalTravelY = winH + leafWidth + 60;
  const translateY = startY + progress * totalTravelY;

  // 2. Natural curved path in the right/outer transition margin (starts at 88vw, curves gently to 72vw)
  const startX = winW * (isDesktop ? 0.88 : 0.82);
  const endX = winW * (isDesktop ? 0.72 : 0.65);
  // Very gentle atmospheric wind sway (+/- 18px)
  const windSway = Math.sin(progress * Math.PI * 2.2) * (isDesktop ? 18 : 10);
  const translateX = startX + (endX - startX) * progress + windSway;

  // 3. Subtle, organic rotation (max +/- 6 degrees, absolutely NO fast spin)
  const rotateZ = -6 + Math.sin(progress * Math.PI * 1.8) * 8;
  const rotateX = Math.sin(progress * Math.PI * 1.4) * 6;
  const rotateY = Math.cos(progress * Math.PI * 1.2) * 8;

  // 4. Smooth cinematic fade in and fade out
  let opacity = 0.88;
  if (progress < 0.12) {
    opacity = (progress / 0.12) * 0.88;
  } else if (progress > 0.85) {
    opacity = Math.max(0, (1 - (progress - 0.85) / 0.15) * 0.88);
  }

  return (
    <div
      className="cinematic-subtle-leaf-layer"
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 5, // Sits in the ambient layer, never blocking navigation or interactions
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: `${leafWidth}px`,
          height: 'auto',
          transform: `
            translate3d(${translateX}px, ${translateY}px, 0)
            rotateX(${rotateX}deg)
            rotateY(${rotateY}deg)
            rotateZ(${rotateZ}deg)
          `,
          transformOrigin: '50% 50%',
          opacity: opacity,
          filter: 'drop-shadow(4px 12px 18px rgba(15, 56, 30, 0.16))',
          transition: 'transform 0.08s linear, opacity 0.08s linear',
          willChange: 'transform, opacity'
        }}
      >
        <img
          src="/images/real-leaf-1.png"
          alt="Natural Agricultural Leaf"
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            userSelect: 'none',
            pointerEvents: 'none'
          }}
        />
      </div>
    </div>
  );
}
