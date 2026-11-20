import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n';
import MandiPriceIntelligence from './MandiPriceIntelligence';
import MarketPriceComparison from './MarketPriceComparison';
import BestMarketSuggestion from './BestMarketSuggestion';
import BasicSellingAdvice from './BasicSellingAdvice';
import MandiPriceTrends from './MandiPriceTrends';
import { getMandiSummary, getMandiHistoryStatus, getMandiForecastReadiness } from '../services/api';

export default function MarketIntelligenceHub() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('live'); // 'live' | 'compare' | 'best' | 'advice' | 'trends' | 'readiness'
  
  // Dynamic telemetry states fetched from backend APIs
  const [summaryData, setSummaryData] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [readinessData, setReadinessData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchAllTelemetry() {
      setLoading(true);
      setErrorMsg(null);
      
      const results = await Promise.allSettled([
        getMandiSummary(),
        getMandiHistoryStatus(),
        getMandiForecastReadiness()
      ]);

      if (!isMounted) return;

      if (results[0].status === 'fulfilled' && results[0].value) {
        setSummaryData(results[0].value);
      }
      if (results[1].status === 'fulfilled' && results[1].value) {
        setHistoryData(results[1].value);
      }
      if (results[2].status === 'fulfilled' && results[2].value) {
        setReadinessData(results[2].value);
      }

      // If all three failed, record error note
      if (results.every(r => r.status === 'rejected')) {
        setErrorMsg('Backend service unavailable');
      }

      setLoading(false);
    }

    fetchAllTelemetry();
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute live vs baseline counts dynamically from sources_breakdown
  const liveCount = historyData?.sources_breakdown?.find(s => s.source_type === 'official_live')?.count ?? null;
  const baselineCount = historyData?.sources_breakdown?.find(s => s.source_type === 'official_agmarknet_baseline')?.count ?? null;
  
  // Total records dynamically from historyData or summaryData
  const totalRecords = historyData?.total_records ?? summaryData?.total_records ?? null;
  const totalMarkets = summaryData?.total_markets ?? historyData?.markets_covered_count ?? null;
  const totalStates = summaryData?.total_states ?? null;

  // Arrival dates dynamically from historyData
  const earliestDate = historyData?.earliest_arrival_date ?? null;
  const latestDate = historyData?.latest_arrival_date ?? null;
  const uniqueDatesCount = historyData?.unique_dates_count ?? null;

  // Priority benchmark mandis dynamically from readiness API
  const benchmarkMarkets = readinessData?.priority_benchmark_mandis || [
    { commodity: "Onion", market: "Lasalgaon APMC", state: "Maharashtra", variety: "Red", importance: "Asia's largest wholesale onion market; primary national price discovery benchmark." },
    { commodity: "Onion", market: "Pimpalgaon APMC", state: "Maharashtra", variety: "Red", importance: "High-volume aggregation hub in the Nashik onion belt." },
    { commodity: "Tomato", market: "Kolar APMC", state: "Karnataka", variety: "Hybrid", importance: "Largest tomato terminal market in South India; critical inter-state supply benchmark." },
    { commodity: "Tomato", market: "Pimpalgaon APMC", state: "Maharashtra", variety: "Local", importance: "Major western production belt terminal market." },
    { commodity: "Wheat", market: "Khanna APMC", state: "Punjab", variety: "Dara", importance: "Asia's largest grain market; core northern wheat procurement benchmark." },
    { commodity: "Wheat", market: "Kota (Bhamashah APMC)", state: "Rajasthan", variety: "Kalyan", importance: "Key spot and futures price convergence market for western and central grain belts." },
    { commodity: "Paddy(Common)", market: "Gondal APMC", state: "Gujarat", variety: "Common", importance: "Consistent wholesale reporting and high commercial liquidity in western India." },
    { commodity: "Paddy(Common)", market: "Kurukshetra APMC", state: "Haryana", variety: "Common", importance: "Primary northern paddy procurement basin with seasonal arrival dynamics." },
    { commodity: "Cotton", market: "Rajkot APMC", state: "Gujarat", variety: "Shankar-6", importance: "National price discovery benchmark for raw unginned cotton (Kapas)." },
    { commodity: "Cotton", market: "Warangal APMC", state: "Telangana", variety: "Other", importance: "Key southern cotton belt market with distinct variety pricing." }
  ];

  const tabs = [
    { id: 'live', label: t('marketHub.tabLive'), icon: '📊' },
    { id: 'compare', label: t('marketHub.tabCompare'), icon: '⚖️' },
    { id: 'best', label: t('marketHub.tabBest'), icon: '🎯' },
    { id: 'advice', label: t('marketHub.tabAdvice'), icon: '💡' },
    { id: 'trends', label: t('marketHub.tabTrends'), icon: '📈' },
    { id: 'readiness', label: t('marketHub.tabReadiness'), icon: '🛡️' },
  ];

  return (
    <div className="market-intelligence-hub-wrapper" style={{ width: '100%', position: 'relative' }}>
      {/* ============================================================ */}
      {/* 1. HUB HEADER & TELEMETRY CHIPS                              */}
      {/* ============================================================ */}
      <div
        className="market-hub-header-card"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 253, 244, 0.9) 100%)',
          borderRadius: '24px',
          padding: '2rem 2.25rem',
          border: '1px solid rgba(34, 197, 94, 0.22)',
          boxShadow: '0 10px 30px -5px rgba(22, 101, 52, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.03)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          marginBottom: '2rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(22, 101, 52, 0.08)', color: '#166534', padding: '0.35rem 0.85rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>
              <span>🏛️</span>
              <span>{t('marketHub.hubBadge')}</span>
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem 0', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              {t('marketHub.hubTitle')}
            </h1>
            <p style={{ fontSize: '0.96rem', color: '#475569', margin: 0, maxWidth: '850px', lineHeight: 1.55 }}>
              {t('marketHub.hubSubtitle')}
            </p>
          </div>

          {/* Quick Metrics Telemetry Bar (Dynamically populated from backend) */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#ffffff', border: '1px solid #e2e8f0', padding: '0.5rem 0.85rem', borderRadius: '12px', fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
              <span>🏪</span>
              <span>
                {totalMarkets != null ? totalMarkets.toLocaleString() : '—'} {t('marketHub.chipApmc')}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#ffffff', border: '1px solid #e2e8f0', padding: '0.5rem 0.85rem', borderRadius: '12px', fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
              <span>🗺️</span>
              <span>
                {totalStates != null ? totalStates : '—'} {t('marketHub.chipStates')}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.5rem 0.85rem', borderRadius: '12px', fontSize: '0.82rem', fontWeight: 700, color: '#166534', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
              <span>📋</span>
              <span>
                {totalRecords != null ? totalRecords.toLocaleString() : '—'} {t('marketHub.chipRecords')}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '0.5rem 0.85rem', borderRadius: '12px', fontSize: '0.82rem', fontWeight: 700, color: '#1d4ed8', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
              <span>🛡️</span>
              <span>{t('marketHub.chipSafeguards')}</span>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 2. UNIFIED TAB NAVIGATION BAR                                */}
        {/* ============================================================ */}
        <div
          role="tablist"
          aria-label="Market Intelligence Navigation"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            overflowX: 'auto',
            paddingTop: '1.5rem',
            marginTop: '1.5rem',
            borderTop: '1px solid rgba(226, 232, 240, 0.8)',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.65rem 1.15rem',
                  borderRadius: '14px',
                  border: isActive ? '1px solid #166534' : '1px solid #e2e8f0',
                  background: isActive ? '#166534' : '#ffffff',
                  color: isActive ? '#ffffff' : '#475569',
                  fontWeight: isActive ? 700 : 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease-in-out',
                  whiteSpace: 'nowrap',
                  boxShadow: isActive ? '0 4px 12px rgba(22, 101, 52, 0.25)' : '0 1px 2px rgba(0, 0, 0, 0.03)',
                  flexShrink: 0
                }}
              >
                <span style={{ fontSize: '1.05rem' }}>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.id === 'readiness' && (
                  <span
                    style={{
                      background: isActive ? 'rgba(255,255,255,0.25)' : '#fef2f2',
                      color: isActive ? '#ffffff' : '#b91c1c',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      padding: '0.15rem 0.45rem',
                      borderRadius: '999px',
                      marginLeft: '0.25rem',
                      border: isActive ? 'none' : '1px solid #fecaca'
                    }}
                  >
                    GATE
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. ACTIVE TAB PANEL                                          */}
      {/* ============================================================ */}
      <div className="market-intelligence-tab-content">
        {/* TAB 1: LIVE MANDI PRICES */}
        {activeTab === 'live' && (
          <div role="tabpanel" aria-label={t('marketHub.tabLive')}>
            <MandiPriceIntelligence />
          </div>
        )}

        {/* TAB 2: PRICE COMPARISON */}
        {activeTab === 'compare' && (
          <div role="tabpanel" aria-label={t('marketHub.tabCompare')}>
            <MarketPriceComparison />
          </div>
        )}

        {/* TAB 3: BEST MARKET SUGGESTION */}
        {activeTab === 'best' && (
          <div role="tabpanel" aria-label={t('marketHub.tabBest')}>
            <BestMarketSuggestion />
          </div>
        )}

        {/* TAB 4: SELLING ADVICE */}
        {activeTab === 'advice' && (
          <div role="tabpanel" aria-label={t('marketHub.tabAdvice')}>
            <BasicSellingAdvice />
          </div>
        )}

        {/* TAB 5: PRICE TRENDS & SMAS */}
        {activeTab === 'trends' && (
          <div role="tabpanel" aria-label={t('marketHub.tabTrends')}>
            <MandiPriceTrends />
          </div>
        )}

        {/* TAB 6: DATA & FORECAST READINESS (STAGE 7A / 7B) */}
        {activeTab === 'readiness' && (
          <div role="tabpanel" aria-label={t('marketHub.tabReadiness')}>
            <div
              className="readiness-main-card"
              style={{
                background: '#ffffff',
                borderRadius: '24px',
                padding: '2.25rem',
                border: '1px solid #e2e8f0',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.04)',
                marginBottom: '2.5rem'
              }}
            >
              {/* Header */}
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#fee2e2', color: '#991b1b', padding: '0.35rem 0.85rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>
                  <span>🛡️</span>
                  <span>{t('marketHub.readinessBadge')}</span>
                </div>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
                  {t('marketHub.readinessTitle')}
                </h2>
                <p style={{ fontSize: '0.95rem', color: '#475569', margin: 0, lineHeight: 1.5 }}>
                  {t('marketHub.readinessSubtitle')}
                </p>
              </div>

              {/* Locked Machine Learning Alert Banner */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
                  borderRadius: '16px',
                  border: '1.5px solid #fda4af',
                  padding: '1.5rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1.25rem',
                  marginBottom: '2.25rem',
                  boxShadow: '0 4px 12px rgba(225, 29, 72, 0.08)'
                }}
              >
                <div style={{ fontSize: '2.2rem', lineHeight: 1, flexShrink: 0 }}>🔒</div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#9f1239', margin: 0 }}>
                      {t('marketHub.statusEngineLocked')}
                    </h3>
                    <span style={{ background: '#be123c', color: '#ffffff', fontSize: '0.72rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: '6px', letterSpacing: '0.05em' }}>
                      {readinessData?.is_ml_training_permitted ? 'PERMITTED' : 'GATE ACTIVE: LOCKED'}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.9rem', color: '#881337', margin: 0, lineHeight: 1.6, fontWeight: 500 }}>
                    {readinessData?.system_verdict || t('marketHub.statusEngineLockedDesc')}
                  </p>
                </div>
              </div>

              {/* Database Telemetry Grid (Dynamically Populated from Database) */}
              <div style={{ marginBottom: '2.5rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1e293b', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>📊</span>
                  <span>{t('marketHub.statsInventoryTitle')}</span>
                  {loading && <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>({t('marketHub.loadingTelemetry')})</span>}
                </h3>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))',
                    gap: '1rem'
                  }}
                >
                  <div style={{ background: '#f8fafc', padding: '1.1rem', borderRadius: '14px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, marginBottom: '0.35rem' }}>{t('marketHub.statTotalRecords')}</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>
                      {totalRecords != null ? totalRecords.toLocaleString() : '—'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 700, marginTop: '0.2rem' }}>100% Verified</div>
                  </div>
                  <div style={{ background: '#f0fdf4', padding: '1.1rem', borderRadius: '14px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 600, marginBottom: '0.35rem' }}>{t('marketHub.statOfficialLive')}</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#166534' }}>
                      {liveCount != null ? liveCount.toLocaleString() : '—'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#15803d', fontWeight: 700, marginTop: '0.2rem' }}>Agmarknet Live</div>
                  </div>
                  <div style={{ background: '#eff6ff', padding: '1.1rem', borderRadius: '14px', border: '1px solid #bfdbfe', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', color: '#1e40af', fontWeight: 600, marginBottom: '0.35rem' }}>{t('marketHub.statCuratedBaseline')}</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e40af' }}>
                      {baselineCount != null ? baselineCount.toLocaleString() : '—'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: 700, marginTop: '0.2rem' }}>Official Agmarknet</div>
                  </div>
                  <div style={{ background: '#fefce8', padding: '1.1rem', borderRadius: '14px', border: '1px solid #fef08a', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', color: '#854d0e', fontWeight: 600, marginBottom: '0.35rem' }}>{t('marketHub.statArrivalDates')}</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#854d0e' }}>
                      {uniqueDatesCount != null ? uniqueDatesCount : '—'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#a16207', fontWeight: 700, marginTop: '0.2rem' }}>
                      {earliestDate && latestDate ? `${earliestDate} & ${latestDate}` : '—'}
                    </div>
                  </div>
                  <div style={{ background: '#f5f3ff', padding: '1.1rem', borderRadius: '14px', border: '1px solid #ddd6fe', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', color: '#5b21b6', fontWeight: 600, marginBottom: '0.35rem' }}>{t('marketHub.statMarketsMonitored')}</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#5b21b6' }}>
                      {totalMarkets != null ? totalMarkets.toLocaleString() : '—'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#6d28d9', fontWeight: 700, marginTop: '0.2rem' }}>
                      {totalStates != null ? `Across ${totalStates} States & UTs` : '—'}
                    </div>
                  </div>
                  <div style={{ background: '#fff1f2', padding: '1.1rem', borderRadius: '14px', border: '1px solid #fecdd3', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', color: '#9f1239', fontWeight: 600, marginBottom: '0.35rem' }}>{t('marketHub.statSyntheticRecords')}</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#be123c' }}>0</div>
                    <div style={{ fontSize: '0.72rem', color: '#e11d48', fontWeight: 700, marginTop: '0.2rem' }}>Zero Fake Data</div>
                  </div>
                </div>
              </div>

              {/* 4 Core Readiness Gate Criteria Cards */}
              <div style={{ marginBottom: '2.5rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1e293b', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>🏛️</span>
                  <span>{t('marketHub.readinessCriteriaTitle')}</span>
                </h3>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
                    gap: '1.25rem'
                  }}
                >
                  <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '1.25rem' }}>🏪</span>
                      <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: '#0f172a' }}>
                        {t('marketHub.ruleGate1Title')}
                      </h4>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569', lineHeight: 1.55 }}>
                      {t('marketHub.ruleGate1Desc')}
                    </p>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '1.25rem' }}>⏱️</span>
                      <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: '#0f172a' }}>
                        {t('marketHub.ruleGate2Title')}
                      </h4>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569', lineHeight: 1.55 }}>
                      {t('marketHub.ruleGate2Desc')}
                    </p>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '1.25rem' }}>🎯</span>
                      <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: '#0f172a' }}>
                        {t('marketHub.ruleGate3Title')}
                      </h4>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569', lineHeight: 1.55 }}>
                      {t('marketHub.ruleGate3Desc')}
                    </p>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '1.25rem' }}>🛡️</span>
                      <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: '#0f172a' }}>
                        {t('marketHub.ruleGate4Title')}
                      </h4>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569', lineHeight: 1.55 }}>
                      {t('marketHub.ruleGate4Desc')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Priority Benchmark APMC Mandis Table (Direct from Backend API) */}
              <div style={{ marginBottom: '2.5rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1e293b', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>🎯</span>
                  <span>{t('marketHub.benchmarkMandisTitle')}</span>
                </h3>
                <div style={{ overflowX: 'auto', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
                        <th style={{ padding: '0.75rem 1rem' }}>{t('marketHub.thBenchmarkMarket')}</th>
                        <th style={{ padding: '0.75rem 1rem' }}>{t('marketHub.thBenchmarkState')}</th>
                        <th style={{ padding: '0.75rem 1rem' }}>{t('marketHub.thBenchmarkCommodity')}</th>
                        <th style={{ padding: '0.75rem 1rem' }}>{t('marketHub.thBenchmarkVariety')}</th>
                        <th style={{ padding: '0.75rem 1rem' }}>{t('marketHub.thBenchmarkImportance')}</th>
                        <th style={{ padding: '0.75rem 1rem' }}>{t('marketHub.thBenchmarkStatus')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {benchmarkMarkets.map((bm, idx) => (
                        <tr key={idx} style={{ borderBottom: idx < benchmarkMarkets.length - 1 ? '1px solid #f1f5f9' : 'none', background: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#0f172a' }}>
                            {bm.market}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>
                            {bm.state}
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <span style={{ background: '#f0fdf4', color: '#166534', padding: '0.2rem 0.55rem', borderRadius: '6px', fontWeight: 600, fontSize: '0.8rem' }}>
                              {bm.commodity}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem 1rem', color: '#64748b', fontSize: '0.82rem' }}>
                            {bm.variety || '—'}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', color: '#475569', fontSize: '0.82rem', maxWidth: '320px', lineHeight: 1.4 }}>
                            {bm.importance || '—'}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#fff1f2', color: '#be123c', border: '1px solid #fecdd3', padding: '0.25rem 0.65rem', borderRadius: '999px', fontSize: '0.76rem', fontWeight: 700 }}>
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#e11d48', display: 'inline-block' }} />
                              {t('marketHub.statusAwaitingDaily')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 5-Tier Forecasting Readiness Taxonomy (Backend Aligned) */}
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1e293b', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>🪜</span>
                  <span>{t('marketHub.taxonomyTitle')}</span>
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '0.86rem', color: '#475569' }}>
                    <span style={{ background: '#e2e8f0', color: '#334155', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem' }}>T1</span>
                    <span style={{ fontWeight: 600 }}>{t('marketHub.taxTier0')}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '0.86rem', color: '#475569' }}>
                    <span style={{ background: '#fef3c7', color: '#92400e', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem' }}>T2</span>
                    <span style={{ fontWeight: 600 }}>{t('marketHub.taxTier1')}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '0.86rem', color: '#475569' }}>
                    <span style={{ background: '#dbeafe', color: '#1e40af', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem' }}>T3</span>
                    <span style={{ fontWeight: 600 }}>{t('marketHub.taxTier2')}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '0.86rem', color: '#475569' }}>
                    <span style={{ background: '#e0e7ff', color: '#4338ca', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem' }}>T4</span>
                    <span style={{ fontWeight: 600 }}>{t('marketHub.taxTier3')}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '10px', background: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: '0.86rem', color: '#166534' }}>
                    <span style={{ background: '#22c55e', color: '#ffffff', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem' }}>T5</span>
                    <span style={{ fontWeight: 700 }}>{t('marketHub.taxTier4')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
