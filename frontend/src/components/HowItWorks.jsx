import React, { useRef, useState, useEffect } from 'react';
import { useTranslation } from '../i18n';
import assetPath from '../utils/assetPath';

export default function HowItWorks() {
  const { t } = useTranslation();
  const sectionRef = useRef(null);
  const [isInView, setIsInView] = useState(false);

  // Trigger progressive animations when section enters viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      { threshold: 0.15 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const stepsData = t.howItWorks?.steps || [
    {
      num: "01",
      step: "ASK",
      icon: "💬",
      title: "Ask your farming question",
      desc: "Ask your farming question."
    },
    {
      num: "02",
      step: "SHARE",
      icon: "📷 🌱",
      title: "Share crop or soil details",
      desc: "Give AgriAI the information it needs."
    },
    {
      num: "03",
      step: "ANALYZE",
      icon: "🧠",
      title: "Local intelligent analysis",
      desc: "AgriAI analyzes your information."
    },
    {
      num: "04",
      step: "GET ANSWERS",
      icon: "💡",
      title: "Clear farming guidance",
      desc: "Get clear farming guidance."
    },
    {
      num: "05",
      step: "TAKE ACTION",
      icon: "🌾",
      title: "Make your farming decision",
      desc: "Use the guidance for your next farming decision."
    }
  ];

  const s1 = stepsData[0] || {};
  const s2 = stepsData[1] || {};
  const s3 = stepsData[2] || {};
  const s4 = stepsData[3] || {};
  const s5 = stepsData[4] || {};

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className={`agri-journey-section ${isInView ? 'is-visible' : ''}`}
      aria-label="How AgriAI Works Journey"
    >
      {/* Embedded Scoped Styling */}
      <style>{`
        .agri-journey-section {
          position: relative;
          background: #fbfaf6;
          padding: 7rem 1.5rem 8rem;
          overflow: hidden;
          border-top: 1px solid rgba(22, 101, 52, 0.08);
          border-bottom: 1px solid rgba(22, 101, 52, 0.08);
        }

        /* Subtle Realistic Agricultural Landscape Background */
        .agri-journey-backdrop {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
        }

        .agri-journey-bg-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          opacity: 0.055;
          filter: saturate(1.2) contrast(1.1);
        }

        .agri-journey-backdrop-mask {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at 50% 45%, rgba(251, 250, 246, 0.45) 0%, rgba(251, 250, 246, 0.92) 65%, #fbfaf6 100%);
        }

        /* Ambient Glow Spheres */
        .agri-ambient-glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          z-index: 0;
        }

        .agri-ambient-glow-1 {
          top: 15%;
          left: 50%;
          transform: translateX(-50%);
          width: 520px;
          height: 380px;
          background: radial-gradient(circle, rgba(34, 197, 94, 0.09) 0%, transparent 70%);
        }

        .agri-ambient-glow-2 {
          top: 45%;
          right: 5%;
          width: 480px;
          height: 480px;
          background: radial-gradient(circle, rgba(22, 101, 52, 0.08) 0%, transparent 70%);
        }

        .agri-ambient-glow-3 {
          bottom: 10%;
          left: 8%;
          width: 420px;
          height: 420px;
          background: radial-gradient(circle, rgba(132, 204, 22, 0.08) 0%, transparent 70%);
        }

        .agri-journey-container {
          max-width: 1280px;
          margin: 0 auto;
          position: relative;
          z-index: 2;
        }

        /* Section Header */
        .agri-journey-header {
          text-align: center;
          max-width: 740px;
          margin: 0 auto 5rem;
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .agri-journey-section.is-visible .agri-journey-header {
          opacity: 1;
          transform: translateY(0);
        }

        .agri-journey-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.4rem 1.05rem;
          border-radius: 9999px;
          background: rgba(22, 101, 52, 0.07);
          border: 1px solid rgba(22, 101, 52, 0.16);
          color: #166534;
          font-size: 0.82rem;
          font-weight: 800;
          letter-spacing: 0.09em;
          text-transform: uppercase;
          margin-bottom: 1.1rem;
          box-shadow: 0 2px 8px rgba(22, 101, 52, 0.05);
        }

        .agri-journey-title {
          font-size: clamp(2.2rem, 4.2vw, 3.25rem);
          font-weight: 800;
          color: #14532d;
          line-height: 1.16;
          margin-bottom: 1rem;
          letter-spacing: -0.025em;
        }

        .agri-journey-subtitle {
          font-size: clamp(1.05rem, 1.8vw, 1.2rem);
          color: #4b5563;
          line-height: 1.6;
          font-weight: 450;
        }

        /* Journey Main Layout Wrapper */
        .agri-journey-flow-layout {
          position: relative;
          width: 100%;
        }

        /* Desktop Curved SVG Journey Pathway */
        .agri-journey-svg-canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1;
          display: block;
        }

        .agri-path-track {
          stroke: rgba(22, 101, 52, 0.12);
          stroke-width: 4;
          stroke-linecap: round;
          stroke-linejoin: round;
          fill: none;
        }

        .agri-path-active {
          stroke: url(#journeyGreenGradient);
          stroke-width: 4;
          stroke-linecap: round;
          stroke-linejoin: round;
          fill: none;
          stroke-dasharray: 2400;
          stroke-dashoffset: 2400;
          transition: stroke-dashoffset 2.2s cubic-bezier(0.25, 1, 0.5, 1) 0.2s;
        }

        .agri-journey-section.is-visible .agri-path-active {
          stroke-dashoffset: 0;
        }

        .agri-path-pulse-dot {
          fill: #22c55e;
          filter: drop-shadow(0 0 6px rgba(34, 197, 94, 0.9));
        }

        /* Stage Cards Layout: 3-Tier Asymmetric Journey */
        .agri-journey-tiers {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          gap: 3.5rem;
        }

        /* Tier 1: Center Step 01 */
        .agri-journey-tier-1 {
          display: flex;
          justify-content: center;
          width: 100%;
        }

        .agri-card-s1-wrapper {
          width: 100%;
          max-width: 620px;
        }

        /* Tier 2: Step 02 (Left) & Step 03 (Centerpiece Right) */
        .agri-journey-tier-2 {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr);
          gap: 3.5rem;
          align-items: center;
          position: relative;
        }

        /* Tier 3: Step 04 (Left) & Step 05 (Right) */
        .agri-journey-tier-3 {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 3.5rem;
          align-items: stretch;
          position: relative;
        }

        /* Connectors with Directional Arrow Chevrons (Desktop & Tablet) */
        .agri-flow-arrow-bridge {
          position: absolute;
          z-index: 4;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }

        /* Bridge between Step 02 and Step 03 */
        .agri-bridge-2-to-3 {
          top: 50%;
          left: calc(100% / 2.15);
          transform: translate(-50%, -50%);
          background: #ffffff;
          padding: 0.45rem 0.85rem;
          border-radius: 9999px;
          border: 1px solid rgba(34, 197, 94, 0.35);
          box-shadow: 0 4px 14px rgba(15, 56, 30, 0.08);
          color: #166534;
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.06em;
          gap: 0.35rem;
        }

        /* Bridge between Step 04 and Step 05 */
        .agri-bridge-4-to-5 {
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: #ffffff;
          padding: 0.45rem 0.85rem;
          border-radius: 9999px;
          border: 1px solid rgba(34, 197, 94, 0.35);
          box-shadow: 0 4px 14px rgba(15, 56, 30, 0.08);
          color: #166534;
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.06em;
          gap: 0.35rem;
        }

        /* Downward directional indicator between Tier 1 & 2 */
        .agri-bridge-1-to-2 {
          display: none;
        }

        /* BASE CARD STYLING */
        .agri-journey-card {
          background: #ffffff;
          border-radius: 24px;
          border: 1px solid rgba(22, 101, 52, 0.12);
          box-shadow: 0 8px 30px -4px rgba(15, 56, 30, 0.06);
          padding: 2.2rem;
          position: relative;
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s ease;
          opacity: 0;
          transform: translateY(32px);
        }

        .agri-journey-section.is-visible .agri-journey-card {
          opacity: 1;
          transform: translateY(0);
        }

        .agri-journey-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 42px -8px rgba(15, 56, 30, 0.13);
          border-color: rgba(34, 197, 94, 0.35);
        }

        /* Reveal Stagger Delays */
        .agri-journey-section.is-visible .agri-step-card-1 {
          transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.1s, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.1s, box-shadow 0.3s ease;
        }
        .agri-journey-section.is-visible .agri-step-card-2 {
          transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.28s, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.28s, box-shadow 0.3s ease;
        }
        .agri-journey-section.is-visible .agri-step-card-3 {
          transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.44s, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.44s, box-shadow 0.3s ease;
        }
        .agri-journey-section.is-visible .agri-step-card-4 {
          transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.6s, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.6s, box-shadow 0.3s ease;
        }
        .agri-journey-section.is-visible .agri-step-card-5 {
          transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.76s, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.76s, box-shadow 0.3s ease;
        }

        /* Top Bar of Each Card */
        .agri-card-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.25rem;
        }

        .agri-step-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .agri-badge-light-green {
          background: rgba(34, 197, 94, 0.1);
          color: #166534;
          border: 1px solid rgba(34, 197, 94, 0.22);
        }

        .agri-card-ghost-num {
          font-size: 1.6rem;
          font-weight: 900;
          color: rgba(22, 101, 52, 0.11);
          font-feature-settings: "tnum";
          line-height: 1;
        }

        .agri-card-title {
          font-size: 1.35rem;
          font-weight: 800;
          color: #14532d;
          line-height: 1.25;
          margin-bottom: 0.65rem;
          letter-spacing: -0.015em;
        }

        .agri-card-desc {
          font-size: 0.94rem;
          color: #4b5563;
          line-height: 1.6;
          margin-bottom: 1.4rem;
        }

        /* ============================================================
           STEP 01 — ASK (Starting Point Specifics)
           ============================================================ */
        .agri-step-card-1 {
          background: linear-gradient(180deg, #ffffff 0%, #fcfdfa 100%);
          border-top: 3px solid #166534;
        }

        .agri-ask-interactive-box {
          background: #f4f7f3;
          border: 1px solid rgba(22, 101, 52, 0.14);
          border-radius: 16px;
          padding: 1.1rem 1.25rem;
          display: flex;
          align-items: center;
          gap: 0.85rem;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.02);
        }

        .agri-ask-bubble-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: #166534;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(22, 101, 52, 0.25);
        }

        .agri-ask-prompt-text {
          font-size: 0.95rem;
          font-weight: 600;
          color: #1f2937;
          line-height: 1.4;
        }

        .agri-ask-prompt-hint {
          font-size: 0.78rem;
          color: #6b7280;
          margin-top: 0.2rem;
          display: flex;
          align-items: center;
          gap: 0.6rem;
          flex-wrap: wrap;
        }

        .agri-ask-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.72rem;
          font-weight: 650;
          color: #166534;
          background: rgba(34, 197, 94, 0.12);
          padding: 0.15rem 0.55rem;
          border-radius: 6px;
        }

        /* ============================================================
           STEP 02 — SHARE (Crop & Soil Telemetry Specifics)
           ============================================================ */
        .agri-step-card-2 {
          background: #ffffff;
        }

        .agri-share-visual-container {
          background: #f8faf7;
          border: 1px dashed rgba(22, 101, 52, 0.22);
          border-radius: 18px;
          padding: 1.1rem;
          display: flex;
          flex-direction: column;
          gap: 0.9rem;
        }

        .agri-leaf-scan-frame {
          position: relative;
          height: 125px;
          border-radius: 12px;
          overflow: hidden;
          background: #0f2c1b;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .agri-leaf-scan-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.88;
        }

        .agri-scan-reticle {
          position: absolute;
          inset: 8px;
          border: 1px dashed rgba(74, 222, 128, 0.65);
          border-radius: 8px;
          pointer-events: none;
        }

        .agri-scan-laser-line {
          position: absolute;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #4ade80, transparent);
          box-shadow: 0 0 8px #4ade80;
          animation: scanLaser 2.4s ease-in-out infinite alternate;
        }

        @keyframes scanLaser {
          0% { top: 15%; opacity: 0.4; }
          100% { top: 85%; opacity: 0.95; }
        }

        .agri-scan-tag {
          position: absolute;
          bottom: 10px;
          left: 10px;
          background: rgba(15, 23, 42, 0.75);
          backdrop-filter: blur(6px);
          color: #86efac;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          padding: 0.2rem 0.55rem;
          border-radius: 6px;
        }

        .agri-share-pills-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.6rem;
        }

        .agri-telemetry-pill {
          background: #ffffff;
          border: 1px solid rgba(22, 101, 52, 0.12);
          border-radius: 10px;
          padding: 0.45rem 0.65rem;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.76rem;
          font-weight: 650;
          color: #374151;
        }

        /* ============================================================
           STEP 03 — ANALYZE (THE CENTERPIECE — AI Engine)
           ============================================================ */
        .agri-step-card-3 {
          background: linear-gradient(165deg, #ffffff 0%, #f2f9f3 100%);
          border: 2px solid rgba(34, 197, 94, 0.45);
          box-shadow: 0 16px 48px -8px rgba(34, 197, 94, 0.22), 0 0 0 1px rgba(34, 197, 94, 0.15);
          transform-origin: center;
        }

        .agri-step-card-3:hover {
          box-shadow: 0 24px 56px -6px rgba(34, 197, 94, 0.28), 0 0 0 2px rgba(34, 197, 94, 0.45);
        }

        .agri-badge-centerpiece {
          background: linear-gradient(90deg, #166534, #15803d);
          color: #ffffff;
          box-shadow: 0 2px 8px rgba(22, 101, 52, 0.25);
          font-size: 0.73rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          padding: 0.28rem 0.8rem;
        }

        .agri-pulse-indicator {
          width: 8px;
          height: 8px;
          background: #4ade80;
          border-radius: 50%;
          box-shadow: 0 0 8px #4ade80;
          animation: centerPulse 1.8s infinite;
        }

        @keyframes centerPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.6; }
        }

        .agri-ai-engine-core {
          background: #ffffff;
          border: 1px solid rgba(34, 197, 94, 0.22);
          border-radius: 18px;
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          position: relative;
          overflow: hidden;
        }

        .agri-ai-radar-backdrop {
          position: absolute;
          top: -20px;
          right: -20px;
          width: 140px;
          height: 140px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(34, 197, 94, 0.12) 0%, transparent 70%);
          pointer-events: none;
        }

        .agri-engine-header-row {
          display: flex;
          align-items: center;
          gap: 0.85rem;
        }

        .agri-emblem-badge {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: #14532d;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 14px rgba(20, 83, 45, 0.3);
          flex-shrink: 0;
          padding: 6px;
        }

        .agri-emblem-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          filter: brightness(1.2);
        }

        .agri-engine-models-list {
          display: flex;
          flex-direction: column;
          gap: 0.55rem;
        }

        .agri-model-tag {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.45rem 0.75rem;
          border-radius: 8px;
          background: #f7faf7;
          border: 1px solid rgba(22, 101, 52, 0.08);
          font-size: 0.77rem;
        }

        .agri-model-name {
          font-weight: 700;
          color: #166534;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .agri-model-metric {
          font-weight: 650;
          color: #059669;
          font-size: 0.72rem;
          background: rgba(16, 185, 129, 0.1);
          padding: 0.15rem 0.5rem;
          border-radius: 4px;
        }

        /* ============================================================
           STEP 04 — GET ANSWERS (Agronomic Guidance Specifics)
           ============================================================ */
        .agri-step-card-4 {
          background: #ffffff;
        }

        .agri-guidance-report-box {
          background: #fbfdfa;
          border: 1px solid rgba(22, 101, 52, 0.14);
          border-radius: 18px;
          padding: 1.15rem;
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }

        .agri-prescription-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 0.65rem;
          border-bottom: 1px solid rgba(22, 101, 52, 0.09);
        }

        .agri-dx-tag {
          font-size: 0.82rem;
          font-weight: 800;
          color: #15803d;
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }

        .agri-dx-conf {
          font-size: 0.72rem;
          font-weight: 700;
          color: #166534;
          background: rgba(34, 197, 94, 0.14);
          padding: 0.15rem 0.45rem;
          border-radius: 4px;
        }

        .agri-action-items {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
        }

        .agri-action-item {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          font-size: 0.79rem;
          color: #374151;
          line-height: 1.45;
        }

        .agri-action-bullet {
          color: #22c55e;
          font-weight: 900;
          flex-shrink: 0;
        }

        /* ============================================================
           STEP 05 — TAKE ACTION (Final Farming Decision Specifics)
           ============================================================ */
        .agri-step-card-5 {
          background: linear-gradient(180deg, #ffffff 0%, #fafff8 100%);
          border-top: 3px solid #15803d;
        }

        .agri-outcome-box {
          background: linear-gradient(135deg, rgba(22, 101, 52, 0.04) 0%, rgba(34, 197, 94, 0.08) 100%);
          border: 1px solid rgba(22, 101, 52, 0.14);
          border-radius: 18px;
          padding: 1.15rem;
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }

        .agri-outcome-milestones {
          display: flex;
          flex-direction: column;
          gap: 0.55rem;
        }

        .agri-milestone-row {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          font-size: 0.8rem;
          font-weight: 650;
          color: #1e3a29;
        }

        .agri-milestone-icon {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: #166534;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.72rem;
          flex-shrink: 0;
        }

        .agri-decision-seal {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.5rem 0.85rem;
          border-radius: 10px;
          background: #ffffff;
          border: 1px solid rgba(34, 197, 94, 0.25);
          font-size: 0.76rem;
          font-weight: 750;
          color: #15803d;
        }

        /* Responsive Layout Breakpoints */

        /* TABLET: 2-Column Connected Journey (max-width: 1024px) */
        @media (max-width: 1024px) {
          .agri-journey-section {
            padding: 5.5rem 1.25rem 6.5rem;
          }

          .agri-journey-svg-canvas {
            display: none;
          }

          .agri-journey-tiers {
            gap: 2.2rem;
          }

          .agri-card-s1-wrapper {
            max-width: 100%;
          }

          .agri-journey-tier-2,
          .agri-journey-tier-3 {
            grid-template-columns: 1fr 1fr;
            gap: 1.5rem;
          }

          .agri-bridge-2-to-3,
          .agri-bridge-4-to-5 {
            display: none;
          }

          .agri-bridge-1-to-2 {
            display: flex;
            align-items: center;
            justify-content: center;
            margin: -0.8rem 0;
            color: #166534;
            font-size: 1.25rem;
          }
        }

        /* MOBILE: Vertical 5-Stage Connected Timeline (max-width: 640px) */
        @media (max-width: 640px) {
          .agri-journey-section {
            padding: 4.5rem 1rem 5.5rem;
          }

          .agri-journey-header {
            margin-bottom: 3.5rem;
          }

          .agri-journey-tiers {
            display: flex;
            flex-direction: column;
            gap: 1.8rem;
            position: relative;
            padding-left: 2rem;
          }

          /* Continuous Vertical Stem Line */
          .agri-journey-tiers::before {
            content: '';
            position: absolute;
            top: 25px;
            bottom: 40px;
            left: 11px;
            width: 3px;
            background: linear-gradient(180deg, #166534 0%, #22c55e 50%, #84cc16 100%);
            border-radius: 9999px;
            z-index: 1;
          }

          .agri-journey-tier-1,
          .agri-journey-tier-2,
          .agri-journey-tier-3 {
            display: flex;
            flex-direction: column;
            gap: 1.8rem;
            width: 100%;
          }

          .agri-card-s1-wrapper {
            max-width: 100%;
          }

          .agri-journey-card {
            padding: 1.6rem 1.25rem;
            border-radius: 20px;
            position: relative;
          }

          /* Milestone Node on the Stem */
          .agri-journey-card::before {
            content: '';
            position: absolute;
            left: -2rem;
            top: 28px;
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background: #ffffff;
            border: 3px solid #166534;
            box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.25);
            z-index: 2;
          }

          .agri-step-card-3::before {
            border-color: #22c55e;
            background: #22c55e;
            box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.4);
          }

          .agri-bridge-2-to-3,
          .agri-bridge-4-to-5,
          .agri-bridge-1-to-2 {
            display: none !important;
          }

          .agri-card-title {
            font-size: 1.2rem;
          }

          .agri-share-pills-row {
            grid-template-columns: 1fr;
          }
        }

        /* Accessibility: Respect prefers-reduced-motion */
        @media (prefers-reduced-motion: reduce) {
          .agri-journey-header,
          .agri-journey-card,
          .agri-path-active {
            opacity: 1 !important;
            transform: none !important;
            transition: none !important;
            stroke-dashoffset: 0 !important;
          }
          .agri-scan-laser-line,
          .agri-pulse-indicator {
            animation: none !important;
          }
          .agri-journey-card:hover {
            transform: none !important;
          }
        }
      `}</style>

      {/* Subtle Background Elements */}
      <div className="agri-journey-backdrop" aria-hidden="true">
        <img
          src={assetPath('/images/hero.jpg')}
          alt=""
          className="agri-journey-bg-img"
          loading="lazy"
        />
        <div className="agri-journey-backdrop-mask" />
      </div>

      <div className="agri-ambient-glow agri-ambient-glow-1" aria-hidden="true" />
      <div className="agri-ambient-glow agri-ambient-glow-2" aria-hidden="true" />
      <div className="agri-ambient-glow agri-ambient-glow-3" aria-hidden="true" />

      <div className="agri-journey-container">
        {/* Section Heading */}
        <div className="agri-journey-header">
          <div className="agri-journey-pill">
            <span>🌾</span>
            <span>{t.howItWorks?.tag || 'HOW AGRIAI WORKS'}</span>
          </div>

          <h2 className="agri-journey-title font-serif">
            {t.howItWorks?.heading || 'How AgriAI Works'}
          </h2>

          <p className="agri-journey-subtitle">
            {t.howItWorks?.subtitle || 'Simple steps. Smarter farming decisions.'}
          </p>
        </div>

        {/* Journey Flow Layout */}
        <div className="agri-journey-flow-layout">
          {/* Desktop Curved SVG Pathway */}
          <svg
            className="agri-journey-svg-canvas"
            viewBox="0 0 1000 820"
            preserveAspectRatio="none"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="journeyGreenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#166534" />
                <stop offset="35%" stopColor="#22c55e" />
                <stop offset="70%" stopColor="#15803d" />
                <stop offset="100%" stopColor="#84cc16" />
              </linearGradient>
            </defs>

            {/* Path 1: Step 01 Bottom (500, 155) -> Step 02 Top (240, 260) */}
            <path
              d="M 500 160 C 500 220, 240 200, 240 260"
              className="agri-path-track"
            />
            <path
              d="M 500 160 C 500 220, 240 200, 240 260"
              className="agri-path-active"
            />

            {/* Path 2: Step 02 Right (460, 395) -> Step 03 Left (525, 395) */}
            <path
              d="M 455 395 L 530 395"
              className="agri-path-track"
            />
            <path
              d="M 455 395 L 530 395"
              className="agri-path-active"
            />

            {/* Path 3: Step 03 Bottom (760, 520) -> Step 04 Top (240, 600) */}
            <path
              d="M 760 520 C 760 580, 240 540, 240 600"
              className="agri-path-track"
            />
            <path
              d="M 760 520 C 760 580, 240 540, 240 600"
              className="agri-path-active"
            />

            {/* Path 4: Step 04 Right (470, 720) -> Step 05 Left (530, 720) */}
            <path
              d="M 470 720 L 530 720"
              className="agri-path-track"
            />
            <path
              d="M 470 720 L 530 720"
              className="agri-path-active"
            />
          </svg>

          {/* 3-Tier Journey Layout */}
          <div className="agri-journey-tiers">
            {/* TIER 1: STEP 01 — ASK (Centered Starting Point) */}
            <div className="agri-journey-tier-1">
              <div className="agri-card-s1-wrapper">
                <div className="agri-journey-card agri-step-card-1">
                  <div className="agri-card-topbar">
                    <span className="agri-step-badge agri-badge-light-green">
                      <span>💬</span>
                      <span>STEP 01 — {s1.step || 'ASK'}</span>
                    </span>
                    <span className="agri-card-ghost-num">01</span>
                  </div>

                  <h3 className="agri-card-title">
                    {s1.title || 'Ask your farming question'}
                  </h3>
                  <p className="agri-card-desc">
                    {s1.desc || 'Ask your farming question.'}
                  </p>

                  <div className="agri-ask-interactive-box">
                    <div className="agri-ask-bubble-icon" aria-hidden="true">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                      </svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="agri-ask-prompt-text">
                        "What is affecting my crop, and what should I spray?"
                      </div>
                      <div className="agri-ask-prompt-hint">
                        <span className="agri-ask-chip">🌾 Crop Diagnostics</span>
                        <span className="agri-ask-chip">🧪 Soil & Fertilizers</span>
                        <span className="agri-ask-chip">🗣️ Multi-language Voice/Text</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Directional indicator between Tier 1 & 2 (visible on tablet) */}
            <div className="agri-bridge-1-to-2" aria-hidden="true">
              ▼
            </div>

            {/* TIER 2: STEP 02 — SHARE & STEP 03 — ANALYZE */}
            <div className="agri-journey-tier-2">
              {/* STEP 02 — SHARE */}
              <div className="agri-journey-card agri-step-card-2">
                <div className="agri-card-topbar">
                  <span className="agri-step-badge agri-badge-light-green">
                    <span>📷</span>
                    <span>STEP 02 — {s2.step || 'SHARE'}</span>
                  </span>
                  <span className="agri-card-ghost-num">02</span>
                </div>

                <h3 className="agri-card-title">
                  {s2.title || 'Share crop or soil details'}
                </h3>
                <p className="agri-card-desc">
                  {s2.desc || 'Give AgriAI the information it needs.'}
                </p>

                <div className="agri-share-visual-container">
                  <div className="agri-leaf-scan-frame">
                    <img
                      src={assetPath('/images/real-leaf-2.png')}
                      alt="Crop leaf sample for AI analysis"
                      className="agri-leaf-scan-img"
                      loading="lazy"
                    />
                    <div className="agri-scan-reticle" />
                    <div className="agri-scan-laser-line" />
                    <span className="agri-scan-tag">📷 Visual Leaf Telemetry</span>
                  </div>

                  <div className="agri-share-pills-row">
                    <div className="agri-telemetry-pill">
                      <span>🌱</span>
                      <span>Crop Type: Tomato / Paddy</span>
                    </div>
                    <div className="agri-telemetry-pill">
                      <span>🧪</span>
                      <span>Soil: N-P-K & pH 6.4</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Directional Flow Chevron Bridge between 02 and 03 */}
              <div className="agri-flow-arrow-bridge agri-bridge-2-to-3" aria-hidden="true">
                <span>FLOW</span>
                <span>───▶</span>
              </div>

              {/* STEP 03 — ANALYZE (CENTERPIECE) */}
              <div className="agri-journey-card agri-step-card-3">
                <div className="agri-card-topbar">
                  <span className="agri-step-badge agri-badge-centerpiece">
                    <span className="agri-pulse-indicator" />
                    <span>STEP 03 — {s3.step || 'ANALYZE'}</span>
                  </span>
                  <span className="agri-card-ghost-num" style={{ color: 'rgba(34, 197, 94, 0.25)' }}>
                    03
                  </span>
                </div>

                <h3 className="agri-card-title">
                  {s3.title || 'Local intelligent analysis'}
                </h3>
                <p className="agri-card-desc">
                  {s3.desc || 'AgriAI analyzes your information.'}
                </p>

                <div className="agri-ai-engine-core">
                  <div className="agri-ai-radar-backdrop" />
                  <div className="agri-engine-header-row">
                    <div className="agri-emblem-badge" aria-hidden="true">
                      <img
                        src={assetPath('/images/agriai-emblem-transparent.png')}
                        alt="AgriAI Neural Engine"
                        className="agri-emblem-img"
                      />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#14532d' }}>
                        AgriAI Intelligent Processing
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#4b5563' }}>
                        Autonomous Multimodal Pipeline
                      </div>
                    </div>
                  </div>

                  <div className="agri-engine-models-list">
                    <div className="agri-model-tag">
                      <span className="agri-model-name">
                        <span>⚡</span> MobileNetV2 Leaf Vision
                      </span>
                      <span className="agri-model-metric">38 Disease Classes</span>
                    </div>

                    <div className="agri-model-tag">
                      <span className="agri-model-name">
                        <span>🌲</span> Random Forest Classifier
                      </span>
                      <span className="agri-model-metric">22 Soil & Crops</span>
                    </div>

                    <div className="agri-model-tag">
                      <span className="agri-model-name">
                        <span>🧠</span> Local / Cloud Agronomist AI
                      </span>
                      <span className="agri-model-metric">Contextual Guidance</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* TIER 3: STEP 04 — GET ANSWERS & STEP 05 — TAKE ACTION */}
            <div className="agri-journey-tier-3">
              {/* STEP 04 — GET ANSWERS */}
              <div className="agri-journey-card agri-step-card-4">
                <div className="agri-card-topbar">
                  <span className="agri-step-badge agri-badge-light-green">
                    <span>💡</span>
                    <span>STEP 04 — {s4.step || 'GET ANSWERS'}</span>
                  </span>
                  <span className="agri-card-ghost-num">04</span>
                </div>

                <h3 className="agri-card-title">
                  {s4.title || 'Clear farming guidance'}
                </h3>
                <p className="agri-card-desc">
                  {s4.desc || 'Get clear farming guidance.'}
                </p>

                <div className="agri-guidance-report-box">
                  <div className="agri-prescription-header">
                    <span className="agri-dx-tag">
                      <span>🔍</span> Early Blight Detected
                    </span>
                    <span className="agri-dx-conf">98.4% Precision</span>
                  </div>

                  <div className="agri-action-items">
                    <div className="agri-action-item">
                      <span className="agri-action-bullet">✓</span>
                      <span><strong>Bio-fungicide Dosage:</strong> Copper oxychloride at 2.5g/L</span>
                    </div>
                    <div className="agri-action-item">
                      <span className="agri-action-bullet">✓</span>
                      <span><strong>Irrigation Adjustment:</strong> Avoid overhead watering to limit leaf moisture</span>
                    </div>
                    <div className="agri-action-item">
                      <span className="agri-action-bullet">✓</span>
                      <span><strong>Time Horizon:</strong> Spray early morning within 48 hours</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Directional Flow Chevron Bridge between 04 and 05 */}
              <div className="agri-flow-arrow-bridge agri-bridge-4-to-5" aria-hidden="true">
                <span>FLOW</span>
                <span>───▶</span>
              </div>

              {/* STEP 05 — TAKE ACTION */}
              <div className="agri-journey-card agri-step-card-5">
                <div className="agri-card-topbar">
                  <span className="agri-step-badge agri-badge-light-green">
                    <span>🌾</span>
                    <span>STEP 05 — {s5.step || 'TAKE ACTION'}</span>
                  </span>
                  <span className="agri-card-ghost-num">05</span>
                </div>

                <h3 className="agri-card-title">
                  {s5.title || 'Make your farming decision'}
                </h3>
                <p className="agri-card-desc">
                  {s5.desc || 'Use the guidance for your next farming decision.'}
                </p>

                <div className="agri-outcome-box">
                  <div className="agri-outcome-milestones">
                    <div className="agri-milestone-row">
                      <div className="agri-milestone-icon">🚜</div>
                      <span>Execute timely field treatment with exact dosage</span>
                    </div>

                    <div className="agri-milestone-row">
                      <div className="agri-milestone-icon">🛡️</div>
                      <span>Halt disease spread and protect upcoming harvest</span>
                    </div>

                    <div className="agri-milestone-row">
                      <div className="agri-milestone-icon">📈</div>
                      <span>Maximize crop yield and preserve farm income</span>
                    </div>
                  </div>

                  <div className="agri-decision-seal">
                    <span>🌱 Smart Farming Decision Verified</span>
                    <span>✓ Ready</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}