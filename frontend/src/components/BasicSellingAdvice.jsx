import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../i18n';
import { getBasicSellingAdvice, getMandiFilters } from '../services/api';
import assetPath from '../utils/assetPath';

export default function BasicSellingAdvice() {
  const { t } = useTranslation();

  // Selection states
  const [selectedCrop, setSelectedCrop] = useState('Tomato');
  const [selectedState, setSelectedState] = useState('');
  const [selectedMarket, setSelectedMarket] = useState('');
  const [selectedVariety, setSelectedVariety] = useState('');

  const [filterOptions, setFilterOptions] = useState({
    states: [],
    commodities: []
  });

  // Data states
  const [adviceData, setAdviceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  // Quick crop benchmark presets
  const popularCrops = ['Tomato', 'Rice (Paddy)', 'Wheat', 'Cotton', 'Soybean', 'Potato', 'Onion'];

  // Load initial filter options
  useEffect(() => {
    (async () => {
      try {
        const filters = await getMandiFilters('');
        setFilterOptions({
          states: filters.states || [],
          commodities: filters.commodities || []
        });
      } catch (err) {
        console.warn('Failed to load filter options for selling advice:', err);
      }
    })();
  }, []);

  // Fetch selling advice
  const fetchAdvice = useCallback(async () => {
    if (!selectedCrop) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await getBasicSellingAdvice({
        commodity: selectedCrop,
        state: selectedState,
        market: selectedMarket,
        variety: selectedVariety,
        unit: 'Rs/Quintal'
      });
      setAdviceData(data);
    } catch (err) {
      console.error('Error fetching selling advice:', err);
      setErrorMsg(err.message || 'Unable to load selling advice.');
      setAdviceData(null);
    } finally {
      setLoading(false);
    }
  }, [selectedCrop, selectedState, selectedMarket, selectedVariety]);

  useEffect(() => {
    fetchAdvice();
  }, [fetchAdvice]);

  const formatPrice = (val) => {
    if (val === null || val === undefined || isNaN(val)) return '—';
    return Number(val).toLocaleString('en-IN', { maximumFractionDigits: 0 });
  };

  const currentMandi = adviceData?.selected_market;
  const bestMandi = adviceData?.best_available_market;
  const priceDiff = adviceData?.price_difference || 0;
  const category = adviceData?.advice_category || 'no_data';
  const availableMarkets = adviceData?.available_markets || [];
  const isBetterAvailable = category === 'better_mandi_available' && bestMandi && priceDiff > 0;

  // Icon and theme based on category
  const getCategoryConfig = () => {
    switch (category) {
      case 'competitive_price':
        return {
          icon: '✅',
          badgeText: t.sellingAdvice?.categoryCompetitive || 'Competitive Price',
          badgeBg: '#dcfce7',
          badgeColor: '#166534',
          borderColor: 'rgba(22, 101, 52, 0.25)',
          headerBg: 'linear-gradient(135deg, rgba(22, 101, 52, 0.08) 0%, rgba(22, 101, 52, 0.02) 100%)'
        };
      case 'better_mandi_available':
        return {
          icon: '⚡',
          badgeText: t.sellingAdvice?.categoryBetter || 'Higher Price Mandi Available',
          badgeBg: '#fef3c7',
          badgeColor: '#92400e',
          borderColor: 'rgba(217, 119, 6, 0.3)',
          headerBg: 'linear-gradient(135deg, rgba(217, 119, 6, 0.08) 0%, rgba(217, 119, 6, 0.02) 100%)'
        };
      case 'limited_data':
        return {
          icon: 'ℹ️',
          badgeText: t.sellingAdvice?.categoryLimited || 'Limited Market Data',
          badgeBg: '#e0f2fe',
          badgeColor: '#0369a1',
          borderColor: 'rgba(2, 132, 199, 0.25)',
          headerBg: 'linear-gradient(135deg, rgba(2, 132, 199, 0.08) 0%, rgba(2, 132, 199, 0.02) 100%)'
        };
      default:
        return {
          icon: '🌾',
          badgeText: t.sellingAdvice?.categoryNoData || 'No Market Data',
          badgeBg: '#f1f5f9',
          badgeColor: '#475569',
          borderColor: '#e2e8f0',
          headerBg: '#f8fafc'
        };
    }
  };

  const config = getCategoryConfig();

  // Practical selling tips icons
  const tips = [
    { icon: '📅', text: t.sellingAdvice?.tip1 || "Check today's mandi price before selling." },
    { icon: '⚖️', text: t.sellingAdvice?.tip2 || 'Compare prices across available markets.' },
    { icon: '🚚', text: t.sellingAdvice?.tip3 || 'Consider transportation expenses.' },
    { icon: '💼', text: t.sellingAdvice?.tip4 || 'Check loading, unloading and commission charges.' },
    { icon: '🌱', text: t.sellingAdvice?.tip5 || 'Check crop quality and market demand.' },
    { icon: '📞', text: t.sellingAdvice?.tip6 || 'Confirm the latest price with the mandi before transporting produce.' }
  ];

  return (
    <div
      id="basic-selling-advice-section"
      style={{
        background: 'rgba(255, 255, 255, 0.96)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '28px',
        border: '1px solid rgba(22, 101, 52, 0.14)',
        boxShadow: '0 20px 48px -10px rgba(15, 56, 30, 0.08), 0 2px 10px rgba(15, 56, 30, 0.03)',
        padding: 'clamp(1.25rem, 3vw, 2.25rem)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Botanical Decorative Leaf Watermark */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: '-25px',
          left: '-25px',
          width: '180px',
          height: 'auto',
          opacity: 0.045,
          pointerEvents: 'none',
          zIndex: 0
        }}
      >
        <img
          src={assetPath('/images/real-leaf-1.png')}
          alt=""
          style={{ width: '100%', height: 'auto', transform: 'rotate(-45deg)' }}
        />
      </div>

      {/* ============================================================ */}
      {/* 1. Header Section                                            */}
      {/* ============================================================ */}
      <div style={{ marginBottom: '1.5rem', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#065f46',
              background: 'rgba(16, 185, 129, 0.12)',
              padding: '0.25rem 0.65rem',
              borderRadius: '999px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <span>📋</span>
            <span>{t.sellingAdvice?.badge || 'Basic Selling Advice'}</span>
          </span>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 600,
              color: '#64748b',
              background: '#f1f5f9',
              padding: '0.25rem 0.6rem',
              borderRadius: '999px'
            }}
          >
            ₹ / Quintal
          </span>
        </div>
        <h2
          style={{
            fontSize: 'clamp(1.35rem, 2.2vw, 1.85rem)',
            fontWeight: 800,
            color: '#0f381e',
            letterSpacing: '-0.02em',
            margin: '0 0 0.35rem 0'
          }}
        >
          {t.sellingAdvice?.heading || 'Harvest Selling Advice & Decision Guide'}
        </h2>
        <p
          style={{
            fontSize: '0.9rem',
            color: '#475569',
            margin: 0,
            maxWidth: '720px',
            lineHeight: 1.5
          }}
        >
          {t.sellingAdvice?.subtitle ||
            'Practical considerations before selling your produce: price competitiveness, alternative mandis, and expense checks.'}
        </p>
      </div>

      {/* ============================================================ */}
      {/* 2. Selection Bar & Quick Chips                               */}
      {/* ============================================================ */}
      <div
        style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '20px',
          padding: '1.15rem',
          marginBottom: '1.75rem',
          position: 'relative',
          zIndex: 1
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
            alignItems: 'center',
            marginBottom: '0.85rem'
          }}
        >
          {/* Crop Selector */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#475569',
                marginBottom: '0.35rem'
              }}
            >
              🌾 {t.sellingAdvice?.selectCrop || 'Select Crop'}
            </label>
            <select
              value={selectedCrop}
              onChange={(e) => {
                setSelectedCrop(e.target.value);
                setSelectedMarket('');
                setSelectedVariety('');
              }}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                fontSize: '0.88rem',
                fontWeight: 600,
                border: '1px solid #cbd5e1',
                borderRadius: '12px',
                outline: 'none',
                background: '#ffffff',
                color: '#0f172a',
                cursor: 'pointer'
              }}
            >
              {filterOptions.commodities.length > 0 ? (
                filterOptions.commodities.map((comm) => (
                  <option key={comm} value={comm}>
                    {comm}
                  </option>
                ))
              ) : (
                popularCrops.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* State Filter */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#475569',
                marginBottom: '0.35rem'
              }}
            >
              📍 {t.sellingAdvice?.selectState || 'Filter by State'}
            </label>
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setSelectedMarket('');
                setSelectedVariety('');
              }}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                fontSize: '0.88rem',
                fontWeight: 600,
                border: '1px solid #cbd5e1',
                borderRadius: '12px',
                outline: 'none',
                background: '#ffffff',
                color: '#0f172a',
                cursor: 'pointer'
              }}
            >
              <option value="">{t.sellingAdvice?.allStates || 'All States (National Benchmark)'}</option>
              {filterOptions.states.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Optional Mandi Selector */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#475569',
                marginBottom: '0.35rem'
              }}
            >
              🏛️ {t.sellingAdvice?.selectMarket || 'Your Local / Current Mandi'}
            </label>
            <select
              value={selectedMarket}
              onChange={(e) => setSelectedMarket(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                fontSize: '0.88rem',
                fontWeight: 600,
                border: '1px solid #cbd5e1',
                borderRadius: '12px',
                outline: 'none',
                background: '#ffffff',
                color: '#0f172a',
                cursor: 'pointer'
              }}
            >
              <option value="">{t.sellingAdvice?.autoMarket || 'Auto-select Market'}</option>
              {availableMarkets.map((m) => (
                <option key={m.id || m.market} value={m.market}>
                  {m.market} ({m.district || m.state}) — ₹{formatPrice(m.modal_price)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Crop Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>Quick Select:</span>
          {popularCrops.map((crop) => (
            <button
              key={crop}
              type="button"
              onClick={() => {
                setSelectedCrop(crop);
                setSelectedMarket('');
                setSelectedVariety('');
              }}
              style={{
                background: selectedCrop === crop ? '#166534' : '#ffffff',
                color: selectedCrop === crop ? '#ffffff' : '#334155',
                border: selectedCrop === crop ? '1px solid #166534' : '1px solid #cbd5e1',
                borderRadius: '999px',
                padding: '0.22rem 0.65rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {crop}
            </button>
          ))}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. Loading & Error States                                    */}
      {/* ============================================================ */}
      {loading ? (
        <div style={{ padding: '3.5rem 1rem', textAlign: 'center' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '3px solid #e2e8f0',
              borderTopColor: '#166534',
              borderRadius: '50%',
              margin: '0 auto 1rem auto',
              animation: 'spin 0.8s linear infinite'
            }}
          />
          <div style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>
            Evaluating selling options for {selectedCrop}...
          </div>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      ) : errorMsg ? (
        <div
          style={{
            padding: '2.5rem 1rem',
            textAlign: 'center',
            background: 'rgba(239, 68, 68, 0.05)',
            border: '1px dashed rgba(239, 68, 68, 0.3)',
            borderRadius: '18px'
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚠️</div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#991b1b', marginBottom: '0.35rem' }}>
            {errorMsg}
          </div>
          <button
            type="button"
            onClick={fetchAdvice}
            style={{
              marginTop: '0.5rem',
              background: '#166534',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              padding: '0.5rem 1.25rem',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      ) : category === 'no_data' || !currentMandi ? (
        <div
          style={{
            padding: '3rem 1rem',
            textAlign: 'center',
            background: '#f8fafc',
            border: '1px dashed #cbd5e1',
            borderRadius: '20px'
          }}
        >
          <div style={{ fontSize: '2.25rem', marginBottom: '0.5rem' }}>🌾</div>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.35rem' }}>
            {t.sellingAdvice?.noDataTitle || 'No Mandi Price Data Available'}
          </div>
          <div style={{ fontSize: '0.86rem', color: '#64748b', maxWidth: '440px', margin: '0 auto 1.25rem auto' }}>
            {t.sellingAdvice?.noDataSub || 'No mandi price data is available for this crop and location. Try changing your filters.'}
          </div>
          {selectedState && (
            <button
              type="button"
              onClick={() => {
                setSelectedState('');
                setSelectedMarket('');
              }}
              style={{
                background: '#166534',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding: '0.55rem 1.25rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              View National Advice
            </button>
          )}
        </div>
      ) : (
        /* ============================================================ */
        /* 4. Selling Advice Decision Card                              */
        /* ============================================================ */
        <div>
          {/* Main Decision Banner */}
          <div
            style={{
              background: config.headerBg,
              border: `2px solid ${config.borderColor}`,
              borderRadius: '24px',
              padding: 'clamp(1.25rem, 2.5vw, 1.85rem)',
              marginBottom: '1.5rem',
              position: 'relative'
            }}
          >
            {/* Top Badge & Metadata */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.5rem',
                marginBottom: '1rem'
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  background: config.badgeBg,
                  color: config.badgeColor,
                  border: `1px solid ${config.borderColor}`,
                  padding: '0.3rem 0.85rem',
                  borderRadius: '999px',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase'
                }}
              >
                <span>{config.icon}</span>
                <span>{config.badgeText}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#64748b' }}>
                <span
                  style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    padding: '0.18rem 0.55rem',
                    borderRadius: '999px',
                    fontWeight: 600
                  }}
                >
                  🏛️ {adviceData?.data_source || 'Agmarknet'}
                </span>
                {adviceData?.arrival_date && (
                  <span style={{ fontWeight: 600 }}>📅 {adviceData.arrival_date}</span>
                )}
              </div>
            </div>

            {/* Advice Statement */}
            <h3
              style={{
                fontSize: 'clamp(1.15rem, 1.9vw, 1.45rem)',
                fontWeight: 800,
                color: '#0f381e',
                lineHeight: 1.4,
                margin: '0 0 1.25rem 0'
              }}
            >
              &quot;{adviceData?.advice_message}&quot;
            </h3>

            {/* Market Comparison Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '1rem',
                alignItems: 'stretch'
              }}
            >
              {/* Evaluated Market Card */}
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '18px',
                  padding: '1.15rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em'
                    }}
                  >
                    {t.sellingAdvice?.currentMarketLabel || 'Your Evaluated Market'}
                  </span>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1e293b', marginTop: '0.35rem' }}>
                    🏛️ {currentMandi.market}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    📍 {currentMandi.district}, {currentMandi.state}
                  </div>
                </div>

                <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>
                    {t.sellingAdvice?.currentModalLabel || 'Current Modal Price'}
                  </div>
                  <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0f172a' }}>
                    ₹{formatPrice(currentMandi.modal_price)}
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginLeft: '4px' }}>
                      / Quintal
                    </span>
                  </div>
                </div>
              </div>

              {/* Better Market Available Card (if applicable) */}
              {isBetterAvailable && bestMandi && (
                <div
                  style={{
                    background: 'linear-gradient(135deg, rgba(22, 101, 52, 0.05) 0%, rgba(22, 101, 52, 0.01) 100%)',
                    border: '2px solid rgba(22, 101, 52, 0.3)',
                    borderRadius: '18px',
                    padding: '1.15rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          color: '#166534',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em'
                        }}
                      >
                        ★ {t.sellingAdvice?.betterMarketLabel || 'Higher-Paying Mandi'}
                      </span>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          background: '#dcfce7',
                          color: '#166534',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '999px',
                          border: '1px solid #86efac'
                        }}
                      >
                        +₹{formatPrice(priceDiff)}/Qtl
                      </span>
                    </div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f381e', marginTop: '0.35rem' }}>
                      🏛️ {bestMandi.market}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#475569' }}>
                      📍 {bestMandi.district}, {bestMandi.state}
                    </div>
                  </div>

                  <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(22, 101, 52, 0.15)' }}>
                    <div style={{ fontSize: '0.74rem', color: '#166534', fontWeight: 700 }}>
                      {t.sellingAdvice?.betterModalLabel || 'Better Modal Price'}
                    </div>
                    <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#166534' }}>
                      ₹{formatPrice(bestMandi.modal_price)}
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginLeft: '4px' }}>
                        / Quintal
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ============================================================ */}
          {/* 5. Practical Selling Tips Section                            */}
          {/* ============================================================ */}
          <div>
            <div style={{ marginBottom: '0.85rem' }}>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f381e', margin: '0 0 0.25rem 0' }}>
                💡 {t.sellingAdvice?.sellingTipsHeading || 'What to Check Before Selling Your Produce'}
              </h4>
              <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
                {t.sellingAdvice?.sellingTipsSub ||
                  'Essential practical tips for farmers to maximize earnings and avoid unexpected deductions.'}
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '0.85rem'
              }}
            >
              {tips.map((item, index) => (
                <div
                  key={index}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '16px',
                    padding: '0.85rem 1rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.65rem'
                  }}
                >
                  <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>{item.icon}</span>
                  <div style={{ fontSize: '0.85rem', color: '#334155', fontWeight: 600, lineHeight: 1.4 }}>
                    {item.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
