import React, { useRef, useState, useEffect } from 'react';
import { useElementScroll } from '../../hooks/useScrollProgress';

/**
 * ScrollReveal: Physically links element transformation to scroll progress.
 * As user scrolls down, element transitions from offset to rest position.
 * When user scrolls up, motion reverses naturally.
 */
export default function ScrollReveal({
  children,
  from = 'bottom', // 'left' | 'right' | 'bottom' | 'top' | 'zoom' | 'rotate-left'
  distance = 100, // Movement distance in px
  delay = 0, // Delay multiplier
  threshold = 0.45, // Progress fraction where element fully settles [0.2 - 0.6]
  className = '',
  style = {}
}) {
  const ref = useRef(null);
  const { progress, isInView } = useElementScroll(ref);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = () => setReducedMotion(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  if (reducedMotion) {
    return (
      <div ref={ref} className={className} style={style}>
        {children}
      </div>
    );
  }

  // Calculate normalized interpolation factor t in [0, 1]
  // Before threshold, element interpolates smoothly; after threshold, it rests at 1 (final settled state)
  const adjustedProgress = Math.max(0, Math.min(1, (progress - delay * 0.05) / threshold));
  // Smooth cubic ease-out curve
  const easeOutProgress = 1 - Math.pow(1 - adjustedProgress, 3);
  
  // Remaining delta to reach final state (1 -> 0 as element enters)
  const delta = 1 - easeOutProgress;

  let transformString = 'none';
  const opacityVal = Math.min(1, Math.max(0, adjustedProgress * 1.3));

  if (isInView) {
    switch (from) {
      case 'left':
        transformString = `translate3d(${-delta * distance}px, ${delta * (distance * 0.25)}px, 0) rotate(${-delta * 7}deg) scale(${1 - delta * 0.08})`;
        break;
      case 'right':
        transformString = `translate3d(${delta * distance}px, ${delta * (distance * 0.25)}px, 0) rotate(${delta * 7}deg) scale(${1 - delta * 0.08})`;
        break;
      case 'top':
        transformString = `translate3d(0, ${-delta * distance}px, 0) scale(${1 - delta * 0.05})`;
        break;
      case 'zoom':
        transformString = `translate3d(0, ${delta * (distance * 0.3)}px, 0) scale(${1 - delta * 0.18})`;
        break;
      case 'rotate-left':
        transformString = `translate3d(${-delta * distance}px, 0, 0) rotate(${-delta * 14}deg) scale(${1 - delta * 0.1})`;
        break;
      case 'bottom':
      default:
        transformString = `translate3d(0, ${delta * distance}px, 0) scale(${1 - delta * 0.04})`;
        break;
    }
  }

  return (
    <div
      ref={ref}
      className={`scroll-reveal-box ${className}`}
      style={{
        ...style,
        transform: isInView ? transformString : `translate3d(0, ${distance}px, 0)`,
        opacity: isInView ? opacityVal : 0,
        transition: 'transform 0.08s linear, opacity 0.08s linear',
        willChange: 'transform, opacity'
      }}
    >
      {children}
    </div>
  );
}
