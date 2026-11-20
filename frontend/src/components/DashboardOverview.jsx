import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n';
import WeatherCard from './WeatherCard';
import { getMandiSummary } from '../services/api';
import {
  Bot,
  Sprout,
  ShieldAlert,
  TrendingUp,
  Store,
  Layers,
  MapPin,
  Cpu,
  ArrowRight,
  Sparkles,
  Calendar
} from 'lucide-react';

export default function DashboardOverview({ user, onNavigateSection }) {
  const { t } = useTranslation();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadStats() {
      try {
        const data = await getMandiSummary();
        if (isMounted && data) {
          setSummary(data);
        }
      } catch (err) {
        // Fallback gracefully without throwing
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadStats();
    return () => {
      isMounted = false;
    };
  }, []);

  const totalMarkets = summary?.total_markets ?? null;
  const totalRecords = summary?.total_records ?? null;
  const totalStates = summary?.total_states ?? null;

  const quickTools = [
    {
      id: 'chat',
      title: t('dashboard.toolAssistantTitle') || 'AI Farming Assistant',
      desc: t('dashboard.toolAssistantDesc') || 'Interactive agronomy guidance, pest remedies, crop management, and multilingual voice chat.',
      action: t('dashboard.toolAssistantAction') || 'Launch Assistant →',
      icon: Bot,
      color: '#245C45',
      badge: 'Multilingual'
    },
    {
      id: 'crop',
      title: t('dashboard.toolCropTitle') || 'Crop Recommendation',
      desc: t('dashboard.toolCropDesc') || 'Scientifically match soil N-P-K nutrient levels, soil pH, rainfall, and climate to ideal crop choices.',
      action: t('dashboard.toolCropAction') || 'Soil Crop Advisory →',
      icon: Sprout,
      color: '#2F8061',
      badge: 'Random Forest'
    },
    {
      id: 'leaf',
      title: t('dashboard.toolDiseaseTitle') || 'Plant Disease Detection',
      desc: t('dashboard.toolDiseaseDesc') || 'Deep learning computer vision for leaf disease diagnosis with organic and chemical treatment advice.',
      action: t('dashboard.toolDiseaseAction') || 'Diagnose Leaf Health →',
      icon: ShieldAlert,
      color: '#b45309',
      badge: 'Vision CNN'
    },
    {
      id: 'mandi',
      title: t('dashboard.toolMarketTitle') || 'Market Intelligence Hub',
      desc: t('dashboard.toolMarketDesc') || 'Live APMC prices across 1,471 mandis, multi-market comparison, selling advice, and forecast readiness.',
      action: t('dashboard.toolMarketAction') || 'Explore Mandi Hub →',
      icon: TrendingUp,
      color: '#1d4ed8',
      badge: 'Stage 8A Hub'
    }
  ];

  return (
    <section id="overview-section" style={{ marginBottom: '2.5rem' }}>
      {/* 1. Welcome Banner */}
      <div
        className="overview-welcome-banner"
        style={{
          background: 'linear-gradient(135deg, #245C45 0%, #1B4534 100%)',
          borderRadius: '20px',
          padding: '2.25rem 2.5rem',
          color: '#FFFFFF',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 10px 25px -5px rgba(27, 69, 52, 0.25)',
          marginBottom: '1.75rem'
        }}
      >
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '780px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', background: 'rgba(255, 255, 255, 0.14)', padding: '0.3rem 0.75rem', borderRadius: '999px', fontSize: '0.76rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '0.85rem' }}>
            <Sparkles size={13} style={{ color: '#B9D8A8' }} />
            <span>{t('dashboard.overviewGreeting') || 'Welcome to AgriAI Intelligence'}</span>
          </div>

          <h1 style={{ fontSize: 'clamp(1.75rem, 3.2vw, 2.35rem)', fontWeight: 800, margin: '0 0 0.5rem 0', letterSpacing: '-0.025em', lineHeight: 1.2 }}>
            {t('dashboard.welcome') || 'Welcome back'}, {user?.name || 'Ramesh'}
          </h1>

          <p style={{ fontSize: '0.98rem', color: '#D2DFD8', margin: '0 0 1.25rem 0', lineHeight: 1.55 }}>
            {t('dashboard.overviewTagline') || 'Precision agricultural advice, plant diagnostics, live APMC market rates, and local offline AI models.'}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(0, 0, 0, 0.2)', padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.78rem', color: '#B9D8A8', fontWeight: 600 }}>
              <Calendar size={13} />
              <span>{t('dashboard.activeDatasetLabel') || 'Active Mandi Data: Nov 18–19, 2026'}</span>
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(0, 0, 0, 0.2)', padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.78rem', color: '#FFFFFF', fontWeight: 600 }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80' }} />
              <span>Local Offline Mode Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Executive KPI Summary Cards (Real Backend Data) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 230px), 1fr))',
          gap: '1rem',
          marginBottom: '1.75rem'
        }}
      >
        <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '16px', border: '1px solid #E3E8E3', boxShadow: '0 1px 3px rgba(29, 43, 36, 0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#718078' }}>
              {t('dashboard.statMandisTitle') || 'APMC Mandis Monitored'}
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#F0F7EE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#245C45' }}>
              <Store size={17} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1D2B24', lineHeight: 1.1 }}>
            {totalMarkets != null ? totalMarkets.toLocaleString() : '—'}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#2F8061', fontWeight: 600, marginTop: '0.35rem' }}>
            {totalStates != null ? `Across ${totalStates} States & UTs` : (t('dashboard.statMandisSub') || 'Pan-India Mandis')}
          </div>
        </div>

        <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '16px', border: '1px solid #E3E8E3', boxShadow: '0 1px 3px rgba(29, 43, 36, 0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#718078' }}>
              {t('dashboard.statRecordsTitle') || 'Wholesale Price Records'}
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#F0F7EE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#245C45' }}>
              <Layers size={17} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1D2B24', lineHeight: 1.1 }}>
            {totalRecords != null ? totalRecords.toLocaleString() : '—'}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#2F8061', fontWeight: 600, marginTop: '0.35rem' }}>
            {t('dashboard.statRecordsSub') || '100% Genuine Govt Agmarknet'}
          </div>
        </div>

        <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '16px', border: '1px solid #E3E8E3', boxShadow: '0 1px 3px rgba(29, 43, 36, 0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#718078' }}>
              {t('dashboard.statStatesTitle') || 'States & UTs Covered'}
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1d4ed8' }}>
              <MapPin size={17} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1D2B24', lineHeight: 1.1 }}>
            {totalStates != null ? totalStates : '—'}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#2563eb', fontWeight: 600, marginTop: '0.35rem' }}>
            {t('dashboard.statStatesSub') || 'Pan-India Price Discovery'}
          </div>
        </div>

        <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '16px', border: '1px solid #E3E8E3', boxShadow: '0 1px 3px rgba(29, 43, 36, 0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#718078' }}>
              {t('dashboard.statModelsTitle') || 'AI Engines Online'}
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b45309' }}>
              <Cpu size={17} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1D2B24', lineHeight: 1.1 }}>
            3 Active
          </div>
          <div style={{ fontSize: '0.74rem', color: '#b45309', fontWeight: 600, marginTop: '0.35rem' }}>
            {t('dashboard.statModelsSub') || 'Crop RF + Vision CNN + Chat'}
          </div>
        </div>
      </div>

      {/* 3. Weather Intelligence Card Section */}
      <div id="weather-section" style={{ scrollMarginTop: '90px', marginBottom: '2rem' }}>
        <WeatherCard />
      </div>

      {/* 4. Quick Access Agricultural Tools Grid */}
      <div style={{ marginTop: '2rem' }}>
        <div style={{ marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1D2B24', margin: '0 0 0.25rem 0' }}>
            {t('dashboard.quickAccessTitle') || 'Smart Farming Tools & Workspaces'}
          </h2>
          <p style={{ fontSize: '0.88rem', color: '#718078', margin: 0 }}>
            {t('dashboard.quickAccessSubtitle') || 'Instant access to AI-powered soil nutrition, leaf pathology, wholesale rates, and multilingual agronomy.'}
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 270px), 1fr))',
            gap: '1.25rem'
          }}
        >
          {quickTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <div
                key={tool.id}
                style={{
                  background: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid #E3E8E3',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 1px 3px rgba(29, 43, 36, 0.04)',
                  transition: 'transform 0.16s ease, box-shadow 0.16s ease'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '12px',
                        background: '#F0F7EE',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: tool.color
                      }}
                    >
                      <Icon size={22} />
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '999px', background: '#F4F7F4', color: '#475569', border: '1px solid #E3E8E3' }}>
                      {tool.badge}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1D2B24', margin: '0 0 0.45rem 0' }}>
                    {tool.title}
                  </h3>

                  <p style={{ fontSize: '0.85rem', color: '#718078', margin: '0 0 1.25rem 0', lineHeight: 1.5 }}>
                    {tool.desc}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigateSection(tool.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '0.65rem 0.95rem',
                    borderRadius: '10px',
                    border: '1px solid #E3E8E3',
                    background: '#FAFBF9',
                    color: '#245C45',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.16s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#245C45';
                    e.currentTarget.style.color = '#FFFFFF';
                    e.currentTarget.style.borderColor = '#245C45';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#FAFBF9';
                    e.currentTarget.style.color = '#245C45';
                    e.currentTarget.style.borderColor = '#E3E8E3';
                  }}
                >
                  <span>{tool.action}</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
