import React, { useEffect, useState, useMemo } from 'react';
import { useScrollProgress } from '../../hooks/useScrollProgress';

/**
 * FloatingEnvironment: Renders multi-depth parallax REAL PHOTOGRAPHIC leaves
 * drifting gracefully through the agricultural scene in response to scroll progress.
 * Zero emojis or cartoon graphics — only authentic isolated botanical assets.
 */
export default function FloatingEnvironment() {
  const { scrollY } = useScrollProgress();
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = () => setReducedMotion(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Curated, photorealistic isolated agricultural leaf instances with natural depth
  const leaves = useMemo(() => [
    // Layer 1: Hero & Upper Transition (Foreground & Middle)
    {
      id: 'leaf-hero-1',
      src: '/images/real-leaf-1.png',
      left: '4%',
      top: '12%',
      width: 75,
      speed: 0.38,
      baseRotation: -12,
      rotRange: 16,
      depth: 'foreground',
      opacity: 0.92,
      blur: 0
    },
    {
      id: 'leaf-hero-2',
      src: '/images/real-leaf-2.png',
      right: '6%',
      top: '24%',
      width: 65,
      speed: 0.28,
      baseRotation: 24,
      rotRange: -18,
      depth: 'middle',
      opacity: 0.85,
      blur: 0
    },
    {
      id: 'leaf-hero-bg',
      src: '/images/real-leaf-3.png',
      left: '22%',
      top: '32%',
      width: 44,
      speed: 0.16,
      baseRotation: 8,
      rotRange: 10,
      depth: 'background',
      opacity: 0.55,
      blur: 1.5
    },

    // Layer 2: About & Problem/Solution Transition
    {
      id: 'leaf-about-1',
      src: '/images/real-leaf-2.png',
      right: '8%',
      top: '48%',
      width: 82,
      speed: 0.42,
      baseRotation: -18,
      rotRange: 22,
      depth: 'foreground',
      opacity: 0.95,
      blur: 0
    },
    {
      id: 'leaf-about-bg',
      src: '/images/real-leaf-1.png',
      left: '12%',
      top: '56%',
      width: 48,
      speed: 0.18,
      baseRotation: 35,
      rotRange: -12,
      depth: 'background',
      opacity: 0.5,
      blur: 2
    },

    // Layer 3: Features & Journey
    {
      id: 'leaf-feat-1',
      src: '/images/real-leaf-3.png',
      left: '6%',
      top: '72%',
      width: 70,
      speed: 0.35,
      baseRotation: 15,
      rotRange: -15,
      depth: 'middle',
      opacity: 0.88,
      blur: 0
    },
    {
      id: 'leaf-feat-2',
      src: '/images/real-leaf-1.png',
      right: '10%',
      top: '84%',
      width: 60,
      speed: 0.3,
      baseRotation: -28,
      rotRange: 20,
      depth: 'middle',
      opacity: 0.82,
      blur: 0
    },
    {
      id: 'leaf-feat-bg',
      src: '/images/real-leaf-2.png',
      left: '18%',
      top: '92%',
      width: 42,
      speed: 0.15,
      baseRotation: 10,
      rotRange: -8,
      depth: 'background',
      opacity: 0.45,
      blur: 2
    }
  ], []);

  if (reducedMotion) return null;

  return (
    <div
      className="floating-environment-canvas"
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 3
      }}
    >
      {leaves.map((leaf) => {
        // Multi-depth parallax calculation
        const yOffset = -(scrollY * leaf.speed * 0.42);
        const xOffset = Math.sin((scrollY * 0.0018) + (leaf.width * 0.1)) * 32;
        // Subtle organic rotation swing (-4° to +7° style oscillation)
        const rotation = leaf.baseRotation + Math.sin((scrollY * 0.002) + leaf.width) * leaf.rotRange;

        return (
          <div
            key={leaf.id}
            style={{
              position: 'absolute',
              top: leaf.top,
              left: leaf.left,
              right: leaf.right,
              width: `${leaf.width}px`,
              height: 'auto',
              transform: `translate3d(${xOffset}px, ${yOffset}px, 0) rotate(${rotation}deg)`,
              opacity: leaf.opacity,
              filter: leaf.blur > 0 ? `blur(${leaf.blur}px)` : 'drop-shadow(0 10px 22px rgba(15, 56, 30, 0.16))',
              transition: 'transform 0.08s linear',
              willChange: 'transform',
              zIndex: leaf.depth === 'foreground' ? 25 : (leaf.depth === 'middle' ? 8 : 2)
            }}
          >
            <img
              src={leaf.src}
              alt="Realistic Agricultural Leaf"
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
                userSelect: 'none',
                pointerEvents: 'none'
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
