import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../i18n';
import { getMandiComparison, getMandiFilters } from '../services/api';
import assetPath from '../utils/assetPath';

export default function MarketPriceComparison() {
  const { t } = useTranslation();

  // Selection states (Default to popular multi-market crop)
  const [selectedCrop, setSelectedCrop] = useState('Tomato');
  const [selectedState, setSelectedState] = useState('');
  const [selectedVariety, setSelectedVariety] = useState('');
  const [filterOptions, setFilterOptions] = useState({
    states: [],
    commodities: []
  });

  // Data states
  const [comparison, setComparison] = useState(null);
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
        console.warn('Failed to load filter options for comparison:', err);
      }
    })();
  }, []);

  // Fetch comparison data
  const fetchComparison = useCallback(async () => {
    if (!selectedCrop) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await getMandiComparison({
        commodity: selectedCrop,
        state: selectedState,
        variety: selectedVariety,
        unit: 'Rs/Quintal'
      });
      setComparison(data);
    } catch (err) {
      console.error('Error fetching market comparison:', err);
      setErrorMsg(err.message || 'Unable to load market price comparison.');
      setComparison(null);
    } finally {
      setLoading(false);
    }
  }, [selectedCrop, selectedState, selectedVariety]);

  useEffect(() => {
    fetchComparison();
  }, [fetchComparison]);

  const formatPrice = (val) => {
    if (val === null || val === undefined || isNaN(val)) return '—';
    return Number(val).toLocaleString('en-IN', { maximumFractionDigits: 0 });
  };

  const highest = comparison?.highest;
  const lowest = comparison?.lowest;
  const priceDiff = comparison?.price_difference || 0;
  const records = comparison?.records || [];
  const maxPriceForScaling = Math.max(...records.map((r) => r.modal_price || 0), 1);

  return (
    <div
      id="market-price-comparison-section"
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
          right: '-25px',
          width: '180px',
          height: 'auto',
          opacity: 0.05,
          pointerEvents: 'none',
          zIndex: 0
        }}
      >
        <img
          src={assetPath('/images/real-leaf-3.png')}
          alt=""
          style={{ width: '100%', height: 'auto', transform: 'rotate(-15deg)' }}
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
            <span>⚖️</span>
            <span>{t.comparison?.badge || 'Market Price Comparison'}</span>
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
          {t.comparison?.heading || 'Compare Wholesale Prices Across APMC Mandis'}
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
          {t.comparison?.subtitle ||
            'Identify the highest-paying markets, analyze price disparities, and discover regional arbitrage opportunities.'}
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
              🌾 {t.comparison?.selectCrop || 'Select Crop'}
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
              📍 {t.comparison?.selectState || 'Filter by State'}
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
              <option value="">{t.comparison?.allStates || 'All States (National Benchmark)'}</option>
              {filterOptions.states.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Variety Filter (Optional, visible if crop has multiple varieties) */}
          {comparison?.varieties && comparison.varieties.length > 1 && (
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
                🌱 {t.comparison?.tableVariety || 'Variety'} ({comparison.varieties.length} Available)
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
                {comparison.varieties.map((v) => (
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
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>Quick Compare:</span>
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
            Analyzing market price variations for {selectedCrop}...
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
            onClick={fetchComparison}
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
      ) : records.length === 0 ? (
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
            {t.comparison?.noDataTitle || 'No Market Records Found'}
          </div>
          <div style={{ fontSize: '0.86rem', color: '#64748b', maxWidth: '440px', margin: '0 auto 1.25rem auto' }}>
            {t.comparison?.noDataSub || 'No APMC mandi records found for this crop in the selected region.'}
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
              View All States
            </button>
          )}
        </div>
      ) : (
        /* ============================================================ */
        /* 4. Comparison Analytics & Visual Dashboard                   */
        /* ============================================================ */
        <div>
          {/* Summary Stat Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
              marginBottom: '1.75rem'
            }}
          >
            {/* Card 1: Highest Price Market */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(22, 101, 52, 0.08) 0%, rgba(22, 101, 52, 0.02) 100%)',
                border: '1px solid rgba(22, 101, 52, 0.25)',
                borderRadius: '20px',
                padding: '1.25rem',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  ★ {t.comparison?.highestBadge || 'Highest Paying Market'}
                </span>
                <span style={{ fontSize: '1.1rem' }}>🏆</span>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f381e', lineHeight: 1.1 }}>
                ₹{formatPrice(highest?.modal_price)}
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginLeft: '4px' }}>/ Qtl</span>
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e293b', marginTop: '0.45rem' }}>
                🏛️ {highest?.market}
              </div>
              <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                📍 {highest?.district}, {highest?.state}
              </div>
            </div>

            {/* Card 2: Lowest Price Market */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '20px',
                padding: '1.25rem',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {t.comparison?.lowestBadge || 'Lowest Paying Market'}
                </span>
                <span style={{ fontSize: '1.1rem' }}>📉</span>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#475569', lineHeight: 1.1 }}>
                ₹{formatPrice(lowest?.modal_price)}
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginLeft: '4px' }}>/ Qtl</span>
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e293b', marginTop: '0.45rem' }}>
                🏛️ {lowest?.market}
              </div>
              <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                📍 {lowest?.district}, {lowest?.state}
              </div>
            </div>

            {/* Card 3: Price Spread / Arbitrage Opportunity */}
            <div
              style={{
                background: priceDiff > 0 ? 'rgba(234, 179, 8, 0.08)' : '#f8fafc',
                border: `1px solid ${priceDiff > 0 ? 'rgba(234, 179, 8, 0.3)' : '#e2e8f0'}`,
                borderRadius: '20px',
                padding: '1.25rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#854d0e', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  💰 {t.comparison?.statSpread || 'Price Spread (Arbitrage)'}
                </span>
                <span style={{ fontSize: '1.1rem' }}>📊</span>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#854d0e', lineHeight: 1.1 }}>
                +₹{formatPrice(priceDiff)}
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#854d0e', marginLeft: '4px' }}>/ Qtl</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#78350f', fontWeight: 600, marginTop: '0.45rem' }}>
                {priceDiff > 0 && lowest?.modal_price
                  ? `+${((priceDiff / lowest.modal_price) * 100).toFixed(1)}% price variation`
                  : 'Uniform pricing across selected mandis'}
              </div>
            </div>

            {/* Card 4: Average Benchmark */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '20px',
                padding: '1.25rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {t.comparison?.statAverage || 'Avg Modal Benchmark'}
                </span>
                <span style={{ fontSize: '1.1rem' }}>📈</span>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f381e', lineHeight: 1.1 }}>
                ₹{formatPrice(comparison?.average_modal_price)}
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginLeft: '4px' }}>/ Qtl</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, marginTop: '0.45rem' }}>
                Across {records.length} {records.length === 1 ? 'market' : 'markets'} compared
              </div>
            </div>
          </div>

          {/* Arbitrage Insight Callout Banner */}
          {records.length > 1 && priceDiff > 0 && highest && lowest && (
            <div
              style={{
                background: 'rgba(22, 101, 52, 0.06)',
                border: '1px solid rgba(22, 101, 52, 0.2)',
                borderRadius: '16px',
                padding: '0.85rem 1.15rem',
                marginBottom: '1.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                fontSize: '0.88rem',
                color: '#0f381e',
                lineHeight: 1.4
              }}
            >
              <span style={{ fontSize: '1.35rem' }}>💡</span>
              <div>
                <strong>{t.comparison?.bestOpportunity || 'Arbitrage Opportunity'}:</strong> Selling{' '}
                <strong>{selectedCrop}</strong> at <strong>{highest.market}</strong> ({highest.state}) yields{' '}
                <strong style={{ color: '#166534' }}>+₹{formatPrice(priceDiff)}/quintal</strong> more than{' '}
                <strong>{lowest.market}</strong> ({lowest.state}).
              </div>
            </div>
          )}

          {records.length === 1 && (
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                padding: '0.75rem 1rem',
                marginBottom: '1.5rem',
                fontSize: '0.84rem',
                color: '#64748b'
              }}
            >
              ℹ️ {t.comparison?.singleMarketNotice || 'Only 1 market found for this selection. Select "All States" to compare across regions.'}
            </div>
          )}

          {/* ============================================================ */}
          {/* 5. Visual Bar Comparison Chart (Pure CSS/SVG Responsive)     */}
          {/* ============================================================ */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '20px',
              padding: '1.35rem',
              marginBottom: '1.75rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f381e' }}>
                📊 {t.comparison?.chartTitle || 'Wholesale Modal Price Comparison (₹/Quintal)'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                {records.length} {records.length === 1 ? 'Mandi' : 'Mandis'} Analyzed
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {records.map((r) => {
                const isHighest = highest && r.id === highest.id && records.length > 1;
                const isLowest = lowest && r.id === lowest.id && records.length > 1;
                const percentage = Math.round((r.modal_price / maxPriceForScaling) * 100);

                return (
                  <div key={r.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: '#1e293b' }}>
                        <span>🏛️ {r.market}</span>
                        <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 500 }}>
                          ({r.district}, {r.state})
                        </span>
                        {isHighest && (
                          <span
                            style={{
                              fontSize: '0.65rem',
                              fontWeight: 800,
                              background: '#dcfce7',
                              color: '#166534',
                              padding: '0.1rem 0.45rem',
                              borderRadius: '999px',
                              border: '1px solid #86efac'
                            }}
                          >
                            ★ Highest
                          </span>
                        )}
                        {isLowest && (
                          <span
                            style={{
                              fontSize: '0.65rem',
                              fontWeight: 800,
                              background: '#fef3c7',
                              color: '#92400e',
                              padding: '0.1rem 0.45rem',
                              borderRadius: '999px',
                              border: '1px solid #fde047'
                            }}
                          >
                            Lowest
                          </span>
                        )}
                      </div>
                      <div style={{ fontWeight: 800, color: isHighest ? '#166534' : '#1e293b' }}>
                        ₹{formatPrice(r.modal_price)}
                      </div>
                    </div>

                    {/* Progress Bar Container */}
                    <div
                      style={{
                        width: '100%',
                        height: '14px',
                        background: '#e2e8f0',
                        borderRadius: '999px',
                        overflow: 'hidden'
                      }}
                    >
                      <div
                        style={{
                          width: `${percentage}%`,
                          height: '100%',
                          background: isHighest
                            ? 'linear-gradient(90deg, #15803d, #16a34a)'
                            : isLowest
                            ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                            : 'linear-gradient(90deg, #0d9488, #14b8a6)',
                          borderRadius: '999px',
                          transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ============================================================ */}
          {/* 6. Comprehensive Market Comparison Table                     */}
          {/* ============================================================ */}
          <div style={{ overflowX: 'auto', borderRadius: '18px', border: '1px solid #e2e8f0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.76rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>{t.comparison?.tableMarket || 'Mandi & Location'}</th>
                  <th style={{ padding: '0.75rem 0.75rem' }}>{t.comparison?.tableVariety || 'Variety'}</th>
                  <th style={{ padding: '0.75rem 0.75rem', textAlign: 'right' }}>Min (₹/Qtl)</th>
                  <th style={{ padding: '0.75rem 0.75rem', textAlign: 'right', fontWeight: 800, color: '#166534' }}>Modal Rate</th>
                  <th style={{ padding: '0.75rem 0.75rem', textAlign: 'right' }}>Max (₹/Qtl)</th>
                  <th style={{ padding: '0.75rem 0.75rem', textAlign: 'right' }}>Spread vs Lowest</th>
                  <th style={{ padding: '0.75rem 0.75rem' }}>{t.comparison?.tableSource || 'Source'}</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>{t.comparison?.tableDate || 'Date'}</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, idx) => {
                  const isHighest = highest && r.id === highest.id && records.length > 1;
                  const spreadFromLowest = lowest ? r.modal_price - lowest.modal_price : 0;
                  const isLive = r.source_type === 'official_live';

                  return (
                    <tr
                      key={r.id}
                      style={{
                        borderBottom: idx < records.length - 1 ? '1px solid #f1f5f9' : 'none',
                        background: isHighest ? 'rgba(22, 101, 52, 0.03)' : '#ffffff'
                      }}
                    >
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 700, color: '#1e293b' }}>🏛️ {r.market}</div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                          📍 {r.district}, {r.state}
                        </div>
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem', color: '#475569', fontSize: '0.8rem' }}>
                        {r.variety || 'Standard'}
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem', textAlign: 'right', color: '#64748b' }}>
                        ₹{formatPrice(r.min_price)}
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem', textAlign: 'right', fontWeight: 800, color: isHighest ? '#166534' : '#0f172a' }}>
                        ₹{formatPrice(r.modal_price)}
                        {isHighest && <span style={{ marginLeft: '4px', fontSize: '0.75rem' }}>★</span>}
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem', textAlign: 'right', color: '#64748b' }}>
                        ₹{formatPrice(r.max_price)}
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem', textAlign: 'right', fontWeight: 700, color: spreadFromLowest > 0 ? '#15803d' : '#64748b' }}>
                        {spreadFromLowest > 0 ? `+₹${formatPrice(spreadFromLowest)}` : 'Baseline'}
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem', fontSize: '0.75rem' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            background: isLive ? 'rgba(34, 197, 94, 0.12)' : 'rgba(241, 245, 249, 0.9)',
                            color: isLive ? '#15803d' : '#475569',
                            border: `1px solid ${isLive ? 'rgba(34, 197, 94, 0.3)' : '#cbd5e1'}`,
                            padding: '0.15rem 0.5rem',
                            borderRadius: '999px',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            fontSize: '0.71rem'
                          }}
                        >
                          <span>{isLive ? '🟢 Live API' : '🏛️ Agmarknet'}</span>
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right', color: '#64748b', fontSize: '0.76rem' }}>
                        {r.arrival_date}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
