import { useState, useEffect, useRef } from 'react';

/**
 * High-performance hook for continuous, scroll-linked progress and velocity.
 * Uses requestAnimationFrame with lerp smoothing for buttery 60/120fps motion.
 */
export function useScrollProgress() {
  const [scrollState, setScrollState] = useState({
    scrollY: 0,
    progress: 0,
    velocity: 0,
    direction: 1 // 1 for down, -1 for up
  });

  const stateRef = useRef({
    currentY: 0,
    targetY: 0,
    lastY: 0,
    velocity: 0,
    rafId: null
  });

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const handleScroll = () => {
      stateRef.current.targetY = window.scrollY || window.pageYOffset || 0;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    stateRef.current.targetY = window.scrollY || 0;
    stateRef.current.currentY = stateRef.current.targetY;

    let lastTime = performance.now();

    const updateLoop = (currentTime) => {
      const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      const { currentY, targetY } = stateRef.current;
      
      // Smooth interpolation factor (lerp)
      const lerpFactor = prefersReducedMotion ? 1 : 0.12;
      const nextY = currentY + (targetY - currentY) * lerpFactor;
      
      const vel = (nextY - stateRef.current.lastY) / (delta || 0.016);
      stateRef.current.velocity = vel;
      stateRef.current.currentY = nextY;
      stateRef.current.lastY = nextY;

      const docHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight
      ) - window.innerHeight;

      const normProgress = docHeight > 0 ? Math.min(1, Math.max(0, nextY / docHeight)) : 0;
      const dir = targetY >= stateRef.current.currentY ? 1 : -1;

      setScrollState({
        scrollY: Math.round(nextY * 10) / 10,
        progress: normProgress,
        velocity: Math.round(vel * 10) / 10,
        direction: dir
      });

      stateRef.current.rafId = requestAnimationFrame(updateLoop);
    };

    stateRef.current.rafId = requestAnimationFrame(updateLoop);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (stateRef.current.rafId) {
        cancelAnimationFrame(stateRef.current.rafId);
      }
    };
  }, []);

  return scrollState;
}

/**
 * Hook to track element's local scroll progress [0, 1] relative to viewport.
 * 0 = element entering bottom, 0.5 = element centered, 1 = element exiting top.
 */
export function useElementScroll(ref) {
  const [elementProgress, setElementProgress] = useState(0);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    let rafId = null;

    const checkScroll = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      const totalDistance = windowHeight + rect.height;
      const currentPos = windowHeight - rect.top;
      const progress = Math.max(0, Math.min(1, currentPos / totalDistance));

      const inView = rect.top < windowHeight + 100 && rect.bottom > -100;
      setIsInView(inView);
      setElementProgress(progress);

      rafId = requestAnimationFrame(checkScroll);
    };

    rafId = requestAnimationFrame(checkScroll);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [ref]);

  return { progress: elementProgress, isInView };
}
