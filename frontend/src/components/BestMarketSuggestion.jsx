import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../i18n';
import { getBestMarketSuggestion, getMandiFilters } from '../services/api';
import assetPath from '../utils/assetPath';

export default function BestMarketSuggestion() {
  const { t } = useTranslation();

  // Selection states (Default to Tomato)
  const [selectedCrop, setSelectedCrop] = useState('Tomato');
  const [selectedState, setSelectedState] = useState('');
  const [selectedVariety, setSelectedVariety] = useState('');
  const [filterOptions, setFilterOptions] = useState({
    states: [],
    commodities: []
  });

  // Data states
  const [suggestion, setSuggestion] = useState(null);
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
        console.warn('Failed to load filter options for best market suggestion:', err);
      }
    })();
  }, []);

  // Fetch recommendation
  const fetchSuggestion = useCallback(async () => {
    if (!selectedCrop) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await getBestMarketSuggestion({
        commodity: selectedCrop,
        state: selectedState,
        variety: selectedVariety,
        unit: 'Rs/Quintal'
      });
      setSuggestion(data);
    } catch (err) {
      console.error('Error fetching best market suggestion:', err);
      setErrorMsg(err.message || 'Unable to compute best market suggestion.');
      setSuggestion(null);
    } finally {
      setLoading(false);
    }
  }, [selectedCrop, selectedState, selectedVariety]);

  useEffect(() => {
    fetchSuggestion();
  }, [fetchSuggestion]);

  const formatPrice = (val) => {
    if (val === null || val === undefined || isNaN(val)) return '—';
    return Number(val).toLocaleString('en-IN', { maximumFractionDigits: 0 });
  };

  const recommended = suggestion?.recommended_market;
  const alternatives = suggestion?.alternatives || [];
  const metrics = suggestion?.metrics || {};
  const isLive = recommended?.source_type === 'official_live';

  return (
    <div
      id="best-market-suggestion-section"
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
          top: '-20px',
          right: '-25px',
          width: '190px',
          height: 'auto',
          opacity: 0.045,
          pointerEvents: 'none',
          zIndex: 0
        }}
      >
        <img
          src={assetPath('/images/real-leaf-2.png')}
          alt=""
          style={{ width: '100%', height: 'auto', transform: 'rotate(45deg)' }}
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
            <span>💡</span>
            <span>{t.bestMarket?.badge || 'Smart Market Recommendation'}</span>
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
          {t.bestMarket?.heading || 'Best Selling Mandi Suggestion'}
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
          {t.bestMarket?.subtitle ||
            'Real-time recommendation identifying the single highest-paying APMC market for your harvested produce.'}
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
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
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
              🌾 {t.bestMarket?.selectCrop || 'Select Crop'}
            </label>
            <select
              value={selectedCrop}
              onChange={(e) => {
                setSelectedCrop(e.target.value);
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

          {/* State Filter (Optional) */}
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
              📍 {t.bestMarket?.selectState || 'Filter by State'}
            </label>
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
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
              <option value="">{t.bestMarket?.allStates || 'All States (National Recommendation)'}</option>
              {filterOptions.states.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Variety Filter (Optional, visible if crop has multiple varieties) */}
          {suggestion?.varieties && suggestion.varieties.length > 1 && (
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
                🌱 {t.bestMarket?.tableVariety || 'Variety'} ({suggestion.varieties.length} Available)
              </label>
              <select
                value={selectedVariety}
                onChange={(e) => setSelectedVariety(e.target.value)}
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
                <option value="">All Varieties</option>
                {suggestion.varieties.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          )}
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
            Finding best selling market for {selectedCrop}...
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
            onClick={fetchSuggestion}
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
      ) : !recommended ? (
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
            {t.bestMarket?.noDataTitle || 'No Market Data Available'}
          </div>
          <div style={{ fontSize: '0.86rem', color: '#64748b', maxWidth: '440px', margin: '0 auto 1.25rem auto' }}>
            {t.bestMarket?.noDataSub || 'No active APMC mandi records found for this crop in the selected location.'}
          </div>
          {selectedState && (
            <button
              type="button"
              onClick={() => setSelectedState('')}
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
              View National Recommendations
            </button>
          )}
        </div>
      ) : (
        /* ============================================================ */
        /* 4. Recommendation Spotlight & Alternatives                   */
        /* ============================================================ */
        <div>
          {/* Top Recommendation Spotlight Hero Card */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(22, 101, 52, 0.08) 0%, rgba(22, 101, 52, 0.02) 100%)',
              border: '2px solid rgba(22, 101, 52, 0.3)',
              borderRadius: '24px',
              padding: 'clamp(1.25rem, 2.5vw, 1.85rem)',
              marginBottom: '1.5rem',
              position: 'relative',
              boxShadow: '0 10px 25px -5px rgba(22, 101, 52, 0.06)'
            }}
          >
            {/* Header pill */}
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
                  background: '#166534',
                  color: '#ffffff',
                  padding: '0.3rem 0.85rem',
                  borderRadius: '999px',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase'
                }}
              >
                <span>🏆</span>
                <span>{t.bestMarket?.topPickBadge || 'Top Recommended Mandi'}</span>
              </div>

              {/* Source & Date tag */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    background: isLive ? 'rgba(34, 197, 94, 0.15)' : '#ffffff',
                    color: isLive ? '#15803d' : '#475569',
                    border: '1px solid #cbd5e1',
                    padding: '0.18rem 0.55rem',
                    borderRadius: '999px',
                    fontWeight: 600
                  }}
                >
                  <span>{isLive ? '🟢 Live API' : '🏛️ Agmarknet'}</span>
                </span>
                <span style={{ color: '#64748b', fontWeight: 600 }}>
                  📅 {recommended.arrival_date}
                </span>
              </div>
            </div>

            {/* Main Details Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '1.25rem',
                alignItems: 'center',
                marginBottom: '1.25rem'
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: 'clamp(1.3rem, 2vw, 1.7rem)',
                    fontWeight: 900,
                    color: '#0f381e',
                    margin: '0 0 0.35rem 0',
                    lineHeight: 1.2
                  }}
                >
                  🏛️ {recommended.market}
                </h3>
                <div style={{ fontSize: '0.92rem', color: '#475569', fontWeight: 600 }}>
                  📍 {recommended.district}, {recommended.state}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.35rem' }}>
                  Variety: <strong style={{ color: '#1e293b' }}>{recommended.variety || 'Standard'}</strong>
                </div>
              </div>

              {/* Big Price Box */}
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid rgba(22, 101, 52, 0.2)',
                  borderRadius: '18px',
                  padding: '1.15rem 1.35rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem'
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>
                  {t.bestMarket?.highestModalRate || 'Highest Modal Price'}
                </div>
                <div style={{ fontSize: 'clamp(1.8rem, 2.8vw, 2.4rem)', fontWeight: 900, color: '#166534', lineHeight: 1 }}>
                  ₹{formatPrice(recommended.modal_price)}
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginLeft: '6px' }}>
                    / Quintal
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', gap: '0.75rem', marginTop: '0.2rem' }}>
                  <span>Min: ₹{formatPrice(recommended.min_price)}</span>
                  <span>•</span>
                  <span>Max: ₹{formatPrice(recommended.max_price)}</span>
                </div>
              </div>
            </div>

            {/* Why This Market Was Selected (Rationale Box) */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid rgba(22, 101, 52, 0.18)',
                borderRadius: '16px',
                padding: '0.9rem 1.15rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                fontSize: '0.88rem',
                color: '#1e293b',
                lineHeight: 1.5
              }}
            >
              <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>💡</span>
              <div>
                <strong style={{ color: '#0f381e' }}>{t.bestMarket?.whySelected || 'Why this market was selected'}:</strong>{' '}
                {suggestion.explanation}
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* 5. Alternative Markets Section                               */}
          {/* ============================================================ */}
          {alternatives.length > 0 ? (
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.85rem'
                }}
              >
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f381e', margin: 0 }}>
                  🏛️ {t.bestMarket?.alternativesHeading || 'Other Available Markets'} ({alternatives.length})
                </h4>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                  Sorted by modal price
                </span>
              </div>

              <div style={{ overflowX: 'auto', borderRadius: '18px', border: '1px solid #e2e8f0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.76rem', textTransform: 'uppercase' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>{t.bestMarket?.tableMarket || 'Market & Location'}</th>
                      <th style={{ padding: '0.75rem 0.75rem' }}>{t.bestMarket?.tableVariety || 'Variety'}</th>
                      <th style={{ padding: '0.75rem 0.75rem', textAlign: 'right' }}>Min (₹/Qtl)</th>
                      <th style={{ padding: '0.75rem 0.75rem', textAlign: 'right', fontWeight: 800 }}>Modal Rate</th>
                      <th style={{ padding: '0.75rem 0.75rem', textAlign: 'right' }}>Max (₹/Qtl)</th>
                      <th style={{ padding: '0.75rem 0.75rem', textAlign: 'right' }}>Difference vs Best</th>
                      <th style={{ padding: '0.75rem 0.75rem' }}>Source</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>{t.bestMarket?.arrivalDate || 'Date'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alternatives.map((alt, idx) => {
                      const gap = alt.price_gap_vs_recommended || 0;
                      const isAltLive = alt.source_type === 'official_live';

                      return (
                        <tr
                          key={alt.id}
                          style={{
                            borderBottom: idx < alternatives.length - 1 ? '1px solid #f1f5f9' : 'none',
                            background: '#ffffff'
                          }}
                        >
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <div style={{ fontWeight: 700, color: '#1e293b' }}>🏛️ {alt.market}</div>
                            <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                              📍 {alt.district}, {alt.state}
                            </div>
                          </td>
                          <td style={{ padding: '0.85rem 0.75rem', color: '#475569', fontSize: '0.8rem' }}>
                            {alt.variety || 'Standard'}
                          </td>
                          <td style={{ padding: '0.85rem 0.75rem', textAlign: 'right', color: '#64748b' }}>
                            ₹{formatPrice(alt.min_price)}
                          </td>
                          <td style={{ padding: '0.85rem 0.75rem', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                            ₹{formatPrice(alt.modal_price)}
                          </td>
                          <td style={{ padding: '0.85rem 0.75rem', textAlign: 'right', color: '#64748b' }}>
                            ₹{formatPrice(alt.max_price)}
                          </td>
                          <td style={{ padding: '0.85rem 0.75rem', textAlign: 'right', fontWeight: 700, color: '#b45309' }}>
                            {gap > 0 ? `-₹${formatPrice(gap)}` : 'Same'}
                          </td>
                          <td style={{ padding: '0.85rem 0.75rem', fontSize: '0.75rem' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                background: isAltLive ? 'rgba(34, 197, 94, 0.12)' : 'rgba(241, 245, 249, 0.9)',
                                color: isAltLive ? '#15803d' : '#475569',
                                border: `1px solid ${isAltLive ? 'rgba(34, 197, 94, 0.3)' : '#cbd5e1'}`,
                                padding: '0.15rem 0.5rem',
                                borderRadius: '999px',
                                fontWeight: 600,
                                whiteSpace: 'nowrap',
                                fontSize: '0.71rem'
                              }}
                            >
                              <span>{isAltLive ? '🟢 Live API' : '🏛️ Agmarknet'}</span>
                            </span>
                          </td>
                          <td style={{ padding: '0.85rem 1rem', textAlign: 'right', color: '#64748b', fontSize: '0.76rem' }}>
                            {alt.arrival_date}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                padding: '0.75rem 1rem',
                fontSize: '0.84rem',
                color: '#64748b'
              }}
            >
              ℹ️ No other APMC mandis recorded in this filter region. Choose &quot;All States&quot; to see alternatives across other states.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
