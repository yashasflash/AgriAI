import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from '../i18n';
import {
  getMandiTrendsSeries,
  getMandiTrendsSummary,
  getMandiFilters,
  getMandiComparison
} from '../services/api';
import assetPath from '../utils/assetPath';

export default function MandiPriceTrends() {
  const { t } = useTranslation();

  // Selection states
  const [selectedCrop, setSelectedCrop] = useState('Tomato');
  const [selectedState, setSelectedState] = useState('');
  const [selectedMarket, setSelectedMarket] = useState('');
  const [selectedVariety, setSelectedVariety] = useState('');

  // Dropdown options
  const [filterOptions, setFilterOptions] = useState({
    states: [],
    commodities: []
  });
  const [availableMarkets, setAvailableMarkets] = useState([]);
  const [availableVarieties, setAvailableVarieties] = useState([]);

  // Data states
  const [trendSeries, setTrendSeries] = useState(null);
  const [trendSummary, setTrendSummary] = useState(null);
  const [loadingSeries, setLoadingSeries] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Active view tab ('chart' vs 'summary')
  const [activeViewTab, setActiveViewTab] = useState('chart');

  // Interactive tooltip state for SVG chart
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Popular quick crop benchmark presets
  const popularCrops = ['Tomato', 'Onion', 'Wheat', 'Rice (Paddy)', 'Cotton', 'Potato', 'Soybean'];

  // Load initial filter options (states & commodities)
  useEffect(() => {
    (async () => {
      try {
        const filters = await getMandiFilters('');
        setFilterOptions({
          states: filters.states || [],
          commodities: filters.commodities || []
        });
      } catch (err) {
        console.warn('Failed to load filter options for trends:', err);
      }
    })();
  }, []);

  // Fetch available markets and varieties when crop or state changes
  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (!selectedCrop) return;
      try {
        const comp = await getMandiComparison({
          commodity: selectedCrop,
          state: selectedState,
          unit: 'Rs/Quintal'
        });
        if (isMounted && comp?.records) {
          const markets = Array.from(new Set(comp.records.map((r) => r.market).filter(Boolean))).sort();
          const varieties = Array.from(new Set(comp.records.map((r) => r.variety).filter(Boolean))).sort();
          setAvailableMarkets(markets);
          setAvailableVarieties(varieties);

          // If current selectedMarket is not in list, auto-select first available market
          if (markets.length > 0 && (!selectedMarket || !markets.includes(selectedMarket))) {
            setSelectedMarket(markets[0]);
          } else if (markets.length === 0) {
            setSelectedMarket('');
          }
        }
      } catch (err) {
        console.warn('Failed to load market options for crop:', err);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [selectedCrop, selectedState]);

  // Fetch multi-market summary for the selected crop & state
  const fetchSummary = useCallback(async () => {
    if (!selectedCrop) return;
    setLoadingSummary(true);
    try {
      const summary = await getMandiTrendsSummary({
        commodity: selectedCrop,
        state: selectedState
      });
      setTrendSummary(summary);
    } catch (err) {
      console.warn('Failed to load trends summary:', err);
      setTrendSummary(null);
    } finally {
      setLoadingSummary(false);
    }
  }, [selectedCrop, selectedState]);

  // Fetch series trend data for selected market
  const fetchSeriesTrend = useCallback(async () => {
    if (!selectedCrop || !selectedMarket) {
      setTrendSeries(null);
      return;
    }
    setLoadingSeries(true);
    setErrorMsg(null);
    try {
      const series = await getMandiTrendsSeries({
        commodity: selectedCrop,
        market: selectedMarket,
        variety: selectedVariety,
        state: selectedState,
        unit: 'Rs/Quintal',
        observations: 30
      });
      setTrendSeries(series);
    } catch (err) {
      console.error('Error fetching series trends:', err);
      setErrorMsg(err.message || 'Unable to evaluate price trends.');
      setTrendSeries(null);
    } finally {
      setLoadingSeries(false);
    }
  }, [selectedCrop, selectedMarket, selectedVariety, selectedState]);

  // Trigger fetches on selection change
  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchSeriesTrend();
  }, [fetchSeriesTrend]);

  const formatPrice = (val) => {
    if (val === null || val === undefined || isNaN(val)) return '—';
    return Number(val).toLocaleString('en-IN', { maximumFractionDigits: 0 });
  };

  const trendData = trendSeries?.trend;
  const confidence = trendSeries?.confidence;
  const observations = trendSeries?.observations || [];
  const obsSummary = trendSeries?.observations_summary;
  const direction = trendData?.direction || 'insufficient_data';

  // SVG Chart Geometry Calculations
  const chartMetrics = useMemo(() => {
    if (!observations || observations.length === 0) return null;

    const prices = observations.map((o) => o.modal_price || 0);
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);
    const rangeP = Math.max(maxP - minP, 100);

    const padY = rangeP * 0.15;
    const yMin = Math.max(0, Math.floor(minP - padY));
    const yMax = Math.ceil(maxP + padY);

    const width = 640;
    const height = 220;
    const padLeft = 60;
    const padRight = 30;
    const padTop = 25;
    const padBottom = 35;

    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;

    const points = observations.map((obs, idx) => {
      const x = observations.length === 1
        ? padLeft + plotW / 2
        : padLeft + (idx / (observations.length - 1)) * plotW;
      const y = padTop + plotH - ((obs.modal_price - yMin) / (yMax - yMin)) * plotH;
      return {
        x,
        y,
        date: obs.arrival_date,
        price: obs.modal_price,
        raw: obs
      };
    });

    const pathD = points.length === 1
      ? ''
      : points.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');

    const areaD = points.length > 1
      ? `${pathD} L ${points[points.length - 1].x} ${padTop + plotH} L ${points[0].x} ${padTop + plotH} Z`
      : '';

    return {
      width,
      height,
      padLeft,
      padRight,
      padTop,
      padBottom,
      plotW,
      plotH,
      yMin,
      yMax,
      points,
      pathD,
      areaD
    };
  }, [observations]);

  // Direction color and styling helper
  const getDirectionBadge = (dir) => {
    switch (dir) {
      case 'rising':
        return {
          bg: '#dcfce7',
          color: '#15803d',
          border: 'rgba(22, 101, 52, 0.25)',
          icon: '↗',
          label: t.priceTrends?.dirRising || 'Rising'
        };
      case 'falling':
        return {
          bg: '#fee2e2',
          color: '#b91c1c',
          border: 'rgba(239, 68, 68, 0.25)',
          icon: '↘',
          label: t.priceTrends?.dirFalling || 'Falling'
        };
      case 'stable':
        return {
          bg: '#e0f2fe',
          color: '#0369a1',
          border: 'rgba(2, 132, 199, 0.25)',
          icon: '→',
          label: t.priceTrends?.dirStable || 'Stable'
        };
      default:
        return {
          bg: '#f1f5f9',
          color: '#475569',
          border: '#cbd5e1',
          icon: '⏳',
          label: t.priceTrends?.dirInsufficient || 'Insufficient Data'
        };
    }
  };

  const dirBadge = getDirectionBadge(direction);

  return (
    <div
      id="mandi-price-trends-section"
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
          top: '-25px',
          right: '-25px',
          width: '185px',
          height: 'auto',
          opacity: 0.13,
          pointerEvents: 'none',
          zIndex: 0
        }}
      >
        <img
          src={assetPath('/images/real-leaf-2.png')}
          alt=""
          style={{ width: '100%', height: 'auto', transform: 'rotate(15deg)' }}
        />
      </div>

      {/* ============================================================ */}
      {/* 1. Header & Official Regulatory Notice                       */}
      {/* ============================================================ */}
      <div style={{ position: 'relative', zIndex: 1, marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.74rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: '#166534',
              background: 'rgba(22, 101, 52, 0.08)',
              padding: '0.3rem 0.75rem',
              borderRadius: '9999px',
              border: '1px solid rgba(22, 101, 52, 0.2)'
            }}
          >
            <span>📈</span>
            <span>{t.priceTrends?.badge || 'Statistical Trend Engine'}</span>
          </span>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              color: '#475569',
              background: '#f1f5f9',
              padding: '0.3rem 0.65rem',
              borderRadius: '9999px'
            }}
          >
            {t.priceTrends?.stageLabel || 'Stage 6: Statistical Analysis'}
          </span>
        </div>

        <h2
          style={{
            fontSize: 'clamp(1.35rem, 2.5vw, 1.85rem)',
            fontWeight: 900,
            color: '#0f381e',
            lineHeight: 1.2,
            margin: '0.25rem 0 0.45rem 0',
            letterSpacing: '-0.02em'
          }}
        >
          {t.priceTrends?.heading || 'Historical Mandi Price Trends & Direction'}
        </h2>

        <p
          style={{
            fontSize: 'clamp(0.85rem, 1.5vw, 0.95rem)',
            color: '#475569',
            margin: 0,
            maxWidth: '820px',
            lineHeight: 1.5
          }}
        >
          {t.priceTrends?.subtitle ||
            'Observation-based statistical trend analysis: price direction, moving averages (7- & 14-day SMA), and market summaries across APMC mandis.'}
        </p>

        {/* Mandatory Non-Predictive Regulatory Disclaimer Banner */}
        <div
          style={{
            marginTop: '0.9rem',
            background: 'rgba(241, 245, 249, 0.85)',
            border: '1px solid #cbd5e1',
            borderRadius: '12px',
            padding: '0.55rem 0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.78rem',
            color: '#334155',
            lineHeight: 1.4
          }}
        >
          <span style={{ fontSize: '1rem', flexShrink: 0 }}>⚖️</span>
          <span>
            <strong>{t.priceTrends?.noticeLabel || 'Notice:'}</strong>{' '}
            {t.priceTrends?.disclaimer ||
              'These indicators describe historical observed mandi prices. They are not guaranteed future prices or financial advice.'}
          </span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. Interactive Filter Bar (Crop, State, Market, Variety)     */}
      {/* ============================================================ */}
      <div
        style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '22px',
          padding: '1.25rem',
          marginBottom: '1.75rem',
          position: 'relative',
          zIndex: 1
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '1rem',
            alignItems: 'flex-end'
          }}
        >
          {/* Crop Dropdown */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
              🌾 {t.priceTrends?.selectCrop || 'Select Commodity'}
            </label>
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 0.85rem',
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                fontSize: '0.86rem',
                fontWeight: 600,
                color: '#1e293b',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {filterOptions.commodities.map((crop) => (
                <option key={crop} value={crop}>
                  {crop}
                </option>
              ))}
            </select>
          </div>

          {/* State Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
              📍 {t.priceTrends?.selectState || 'Filter by State'}
            </label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 0.85rem',
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                fontSize: '0.86rem',
                fontWeight: 600,
                color: '#1e293b',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="">{t.priceTrends?.allStates || 'All States (National)'}</option>
              {filterOptions.states.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* APMC Market Selection */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
              🏛️ {t.priceTrends?.selectMarket || 'Select APMC Market'}
            </label>
            <select
              value={selectedMarket}
              onChange={(e) => setSelectedMarket(e.target.value)}
              disabled={availableMarkets.length === 0}
              style={{
                width: '100%',
                padding: '0.6rem 0.85rem',
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                background: availableMarkets.length === 0 ? '#f1f5f9' : '#ffffff',
                fontSize: '0.86rem',
                fontWeight: 600,
                color: '#1e293b',
                outline: 'none',
                cursor: availableMarkets.length === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              {availableMarkets.length === 0 && <option value="">{t.priceTrends?.noMarketsFound || 'No markets found'}</option>}
              {availableMarkets.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Variety Dropdown */}
          {availableVarieties.length > 1 && (
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                🏷️ {t.priceTrends?.selectVariety || 'Select Variety'}
              </label>
              <select
                value={selectedVariety}
                onChange={(e) => setSelectedVariety(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.85rem',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  color: '#1e293b',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="">{t.priceTrends?.allVarieties || 'All Varieties'}</option>
                {availableVarieties.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Quick-Select Popular Crop Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.9rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.73rem', fontWeight: 700, color: '#64748b' }}>{t.priceTrends?.quickCrops || 'Quick crops:'}</span>
          {popularCrops.map((crop) => (
            <button
              key={crop}
              type="button"
              onClick={() => {
                setSelectedCrop(crop);
                setSelectedVariety('');
              }}
              style={{
                fontSize: '0.74rem',
                fontWeight: selectedCrop === crop ? 800 : 600,
                color: selectedCrop === crop ? '#ffffff' : '#334155',
                background: selectedCrop === crop ? '#166534' : '#ffffff',
                border: `1px solid ${selectedCrop === crop ? '#166534' : '#cbd5e1'}`,
                borderRadius: '9999px',
                padding: '0.22rem 0.65rem',
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
      {/* 3. Multi-Market Summary Cards (Rising, Falling, Stable, Ins) */}
      {/* ============================================================ */}
      <div style={{ marginBottom: '1.75rem', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f381e' }}>
            🏛️ {selectedCrop} {t.priceTrends?.tabSummary || 'Market Trend Summary'}
          </div>
          <div style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 600 }}>
            {trendSummary?.total_markets_analyzed || 0} {t.priceTrends?.totalMarketsAnalyzed || 'Markets Analyzed'}
            {selectedState && ` (${selectedState})`}
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '0.85rem'
          }}
        >
          {/* Card 1: Rising Markets */}
          <div
            style={{
              background: '#f0fdf4',
              border: '1px solid rgba(22, 101, 52, 0.25)',
              borderRadius: '18px',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase' }}>
                {t.priceTrends?.cardRising || 'Rising Markets'}
              </span>
              <span style={{ fontSize: '1.1rem' }}>📈</span>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#15803d' }}>
              {trendSummary?.direction_counts?.rising ?? 0}
            </div>
            <div style={{ fontSize: '0.74rem', color: '#166534', fontWeight: 600 }}>
              {t.priceTrends?.higherThanPrev || 'Higher than previous observation'}
            </div>
          </div>

          {/* Card 2: Falling Markets */}
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: '18px',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#991b1b', textTransform: 'uppercase' }}>
                {t.priceTrends?.cardFalling || 'Falling Markets'}
              </span>
              <span style={{ fontSize: '1.1rem' }}>📉</span>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#b91c1c' }}>
              {trendSummary?.direction_counts?.falling ?? 0}
            </div>
            <div style={{ fontSize: '0.74rem', color: '#991b1b', fontWeight: 600 }}>
              {t.priceTrends?.lowerThanPrev || 'Lower than previous observation'}
            </div>
          </div>

          {/* Card 3: Stable Markets */}
          <div
            style={{
              background: '#f0f9ff',
              border: '1px solid rgba(2, 132, 199, 0.25)',
              borderRadius: '18px',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0369a1', textTransform: 'uppercase' }}>
                {t.priceTrends?.cardStable || 'Stable Markets'}
              </span>
              <span style={{ fontSize: '1.1rem' }}>⚖️</span>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0284c7' }}>
              {trendSummary?.direction_counts?.stable ?? 0}
            </div>
            <div style={{ fontSize: '0.74rem', color: '#0369a1', fontWeight: 600 }}>
              {t.priceTrends?.varianceWithin || 'Price variance within ±1.0%'}
            </div>
          </div>

          {/* Card 4: Insufficient History */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '18px',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>
                {t.priceTrends?.cardInsufficient || 'Insufficient History'}
              </span>
              <span style={{ fontSize: '1.1rem' }}>⏳</span>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#475569' }}>
              {trendSummary?.direction_counts?.insufficient_data ?? (trendSummary?.markets_with_insufficient_history || 0)}
            </div>
            <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>
              {t.priceTrends?.awaitingAccumulation || 'Single date / awaiting accumulation'}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 4. Tab Navigation (Chart vs Market Breakdown Table)          */}
      {/* ============================================================ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <button
          type="button"
          onClick={() => setActiveViewTab('chart')}
          style={{
            padding: '0.45rem 1rem',
            borderRadius: '9999px',
            fontSize: '0.84rem',
            fontWeight: 700,
            cursor: 'pointer',
            border: activeViewTab === 'chart' ? '1px solid #166534' : '1px solid #e2e8f0',
            background: activeViewTab === 'chart' ? '#166534' : '#ffffff',
            color: activeViewTab === 'chart' ? '#ffffff' : '#475569',
            transition: 'all 0.15s ease'
          }}
        >
          📊 {t.priceTrends?.tabChart || 'Historical Price Chart'} ({selectedMarket || (t.priceTrends?.selectMandiPrompt || 'Select Mandi')})
        </button>
        <button
          type="button"
          onClick={() => setActiveViewTab('summary')}
          style={{
            padding: '0.45rem 1rem',
            borderRadius: '9999px',
            fontSize: '0.84rem',
            fontWeight: 700,
            cursor: 'pointer',
            border: activeViewTab === 'summary' ? '1px solid #166534' : '1px solid #e2e8f0',
            background: activeViewTab === 'summary' ? '#166534' : '#ffffff',
            color: activeViewTab === 'summary' ? '#ffffff' : '#475569',
            transition: 'all 0.15s ease'
          }}
        >
          🏛️ {t.priceTrends?.tabSummary || 'Market Trend Summary'} ({trendSummary?.total_markets_analyzed || 0} Mandis)
        </button>
      </div>

      {/* ============================================================ */}
      {/* 5. View Content: Loading & Error States                      */}
      {/* ============================================================ */}
      {loadingSeries ? (
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
            {t.priceTrends?.loading || 'Analyzing mandi price trends...'}
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
            borderRadius: '18px',
            marginBottom: '1rem'
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚠️</div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#991b1b', marginBottom: '0.35rem' }}>
            {errorMsg}
          </div>
          <button
            type="button"
            onClick={fetchSeriesTrend}
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
            {t.priceTrends?.retryBtn || 'Retry'}
          </button>
        </div>
      ) : activeViewTab === 'summary' ? (
        /* ============================================================ */
        /* 6. Multi-Market Breakdown Table Tab                          */
        /* ============================================================ */
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '20px',
            padding: '1.25rem',
            overflowX: 'auto'
          }}
        >
          <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f381e', marginBottom: '0.75rem' }}>
            🏛️ {selectedCrop} {t.priceTrends?.tableHeading || 'APMC Mandi Price Directions'}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '0.65rem 0.85rem', fontWeight: 700, color: '#475569' }}>{t.priceTrends?.thMandiLocation || 'Mandi & Location'}</th>
                <th style={{ padding: '0.65rem 0.85rem', fontWeight: 700, color: '#475569' }}>{t.priceTrends?.thVariety || 'Variety'}</th>
                <th style={{ padding: '0.65rem 0.85rem', fontWeight: 700, color: '#475569' }}>{t.priceTrends?.thLatestPrice || 'Latest Modal Price'}</th>
                <th style={{ padding: '0.65rem 0.85rem', fontWeight: 700, color: '#475569' }}>{t.priceTrends?.thDirection || 'Price Direction'}</th>
                <th style={{ padding: '0.65rem 0.85rem', fontWeight: 700, color: '#475569' }}>{t.priceTrends?.thChange || 'Change'}</th>
                <th style={{ padding: '0.65rem 0.85rem', fontWeight: 700, color: '#475569' }}>{t.priceTrends?.thAction || 'Action'}</th>
              </tr>
            </thead>
            <tbody>
              {trendSummary?.markets?.map((m, idx) => {
                const badge = getDirectionBadge(m.direction);
                return (
                  <tr
                    key={`${m.market}-${idx}`}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      background: selectedMarket === m.market ? '#f0fdf4' : 'transparent',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <td style={{ padding: '0.65rem 0.85rem' }}>
                      <div style={{ fontWeight: 700, color: '#1e293b' }}>🏛️ {m.market}</div>
                      <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                        {m.district ? `${m.district}, ` : ''}{m.display_state || m.state}
                      </div>
                    </td>
                    <td style={{ padding: '0.65rem 0.85rem', color: '#475569' }}>
                      {m.variety || 'Common'}
                    </td>
                    <td style={{ padding: '0.65rem 0.85rem', fontWeight: 700, color: '#0f381e' }}>
                      ₹{formatPrice(m.latest_price)} <span style={{ fontSize: '0.72rem', color: '#64748b' }}>/ Qtl</span>
                    </td>
                    <td style={{ padding: '0.65rem 0.85rem' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.55rem',
                          borderRadius: '9999px',
                          background: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`
                        }}
                      >
                        <span>{badge.icon}</span>
                        <span>{badge.label}</span>
                      </span>
                    </td>
                    <td style={{ padding: '0.65rem 0.85rem', fontSize: '0.78rem' }}>
                      {m.price_difference !== null && m.price_difference !== undefined ? (
                        <span style={{ fontWeight: 700, color: m.price_difference > 0 ? '#15803d' : m.price_difference < 0 ? '#b91c1c' : '#0284c7' }}>
                          {m.price_difference > 0 ? '+' : ''}₹{formatPrice(m.price_difference)} ({m.percentage_change > 0 ? '+' : ''}{m.percentage_change}%)
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '0.65rem 0.85rem' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMarket(m.market);
                          setActiveViewTab('chart');
                        }}
                        style={{
                          padding: '0.3rem 0.65rem',
                          borderRadius: '8px',
                          border: '1px solid #166534',
                          background: '#ffffff',
                          color: '#166534',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {t.priceTrends?.viewChartBtn || 'View Chart'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* ============================================================ */
        /* 7. Historical Chart & Series Diagnostics View                */
        /* ============================================================ */
        <div>
          {/* Top Series Stat Badges */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}
          >
            {/* Stat 1: Latest Price */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '18px',
                padding: '1.15rem'
              }}
            >
              <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                {t.priceTrends?.latestPrice || 'Latest Modal Price'}
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#0f381e', lineHeight: 1.1 }}>
                ₹{formatPrice(trendData?.latest_valid_price)}
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginLeft: '4px' }}>/ Qtl</span>
              </div>
              <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '0.35rem' }}>
                📅 {trendData?.latest_arrival_date || '—'}
              </div>
            </div>

            {/* Stat 2: Direction & Price Change */}
            <div
              style={{
                background: dirBadge.bg,
                border: `1px solid ${dirBadge.border}`,
                borderRadius: '18px',
                padding: '1.15rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: dirBadge.color, textTransform: 'uppercase' }}>
                  {t.priceTrends?.direction || 'Price Direction'}
                </span>
                <span style={{ fontSize: '1.2rem' }}>{dirBadge.icon}</span>
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 900, color: dirBadge.color, lineHeight: 1.1 }}>
                {dirBadge.label}
              </div>
              <div style={{ fontSize: '0.76rem', color: dirBadge.color, fontWeight: 700, marginTop: '0.35rem' }}>
                {trendData?.price_difference !== null && trendData?.price_difference !== undefined ? (
                  <>
                    {trendData.price_difference > 0 ? '+' : ''}₹{formatPrice(trendData.price_difference)}/Qtl (
                    {trendData.percentage_change > 0 ? '+' : ''}{trendData.percentage_change}%)
                  </>
                ) : (
                  t.priceTrends?.awaitingSecondObs || 'Awaiting second observation'
                )}
              </div>
            </div>

            {/* Stat 3: 7-Observation SMA */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '18px',
                padding: '1.15rem'
              }}
            >
              <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                {t.priceTrends?.sma7Label || '7-Observation SMA'}
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: 900, color: trendData?.sma_7 ? '#d97706' : '#94a3b8', lineHeight: 1.1 }}>
                {trendData?.sma_7 ? `₹${formatPrice(trendData.sma_7)}` : '—'}
                {trendData?.sma_7 && <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginLeft: '4px' }}>/ Qtl</span>}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '0.35rem' }}>
                {trendData?.sma_7
                  ? (t.priceTrends?.sma7Active || 'Trailing 7 valid APMC arrivals')
                  : (t.priceTrends?.sma7Inactive || 'Requires ≥ 7 valid observations')}
              </div>
            </div>

            {/* Stat 4: History Readiness & Confidence */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '18px',
                padding: '1.15rem'
              }}
            >
              <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                {t.priceTrends?.readinessTitle || 'History Readiness'}
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', lineHeight: 1.2 }}>
                {obsSummary?.valid_observations_count || 0}{' '}
                {obsSummary?.valid_observations_count === 1
                  ? (t.priceTrends?.obsLabelSingular || 'Observation')
                  : (t.priceTrends?.obsLabelPlural || 'Observations')}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#166534', fontWeight: 700, marginTop: '0.35rem' }}>
                🎯 {confidence?.confidence_level?.toUpperCase() || 'LOW'} {t.priceTrends?.confidenceBadgeLabel || 'Confidence'} ({confidence?.confidence_score ?? 0}%)
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* 8. Insufficient Data Panel (When observations < 2)           */}
          {/* ============================================================ */}
          {direction === 'insufficient_data' && (
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.98) 0%, rgba(241, 245, 249, 0.95) 100%)',
                border: '1px solid #cbd5e1',
                borderRadius: '20px',
                padding: '1.5rem',
                marginBottom: '1.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                <span style={{ fontSize: '2rem', lineHeight: 1 }}>⏳</span>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1e293b', margin: '0 0 0.25rem 0' }}>
                    {t.priceTrends?.insufficientTitle || 'Insufficient Historical Data'}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: '#475569', margin: 0, lineHeight: 1.5 }}>
                    {t.priceTrends?.insufficientSub ||
                      'At least 2 valid historical observations on distinct arrival dates are required to evaluate price direction.'}
                  </p>
                </div>
              </div>

              {/* Informational Diagnostic Matrix */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '0.75rem',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '1rem'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>
                    {t.priceTrends?.validObsCount || 'Valid Observations Recorded'}
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e293b' }}>
                    {obsSummary?.valid_observations_count || 0}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>
                    {t.priceTrends?.distinctDatesCount || 'Distinct Arrival Dates'}
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e293b' }}>
                    {obsSummary?.distinct_arrival_dates_count || 0}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>
                    {t.priceTrends?.allowedCalcLabel || 'Allowed Calculation'}
                  </div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#166534' }}>
                    {trendData?.allowed_calculation || 'Display latest price only'}
                  </div>
                </div>
              </div>

              {/* Automatic Daily Collection Callout */}
              <div
                style={{
                  background: 'rgba(22, 101, 52, 0.05)',
                  border: '1px solid rgba(22, 101, 52, 0.2)',
                  borderRadius: '12px',
                  padding: '0.75rem 1rem',
                  fontSize: '0.82rem',
                  color: '#0f381e',
                  lineHeight: 1.45
                }}
              >
                💡 <strong>{t.priceTrends?.collectionNoticeLabel || 'Collection Notice:'}</strong>{' '}
                {t.priceTrends?.dailyCollectionNotice ||
                  'Scheduled daily collection executes at 18:30 IST. Actual data accumulation depends on APMC market operations, trading days, and government portal availability.'}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* 9. Visual SVG Price Trend Chart                              */}
          {/* ============================================================ */}
          {chartMetrics && (
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '20px',
                padding: '1.35rem',
                marginBottom: '1.75rem',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0f381e' }}>
                    📈 {t.priceTrends?.chartTitle || 'Historical Modal Price Trend (₹/Quintal)'}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                    🏛️ {selectedMarket} — {selectedCrop} ({observations.length}{' '}
                    {observations.length === 1
                      ? (t.priceTrends?.obsLabelSingular || 'observation')
                      : (t.priceTrends?.obsLabelPlural || 'observations')})
                  </div>
                </div>

                {/* Chart Legend */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', fontSize: '0.74rem', fontWeight: 700 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#166534' }}>
                    <span style={{ width: '12px', height: '3px', background: '#166534', borderRadius: '2px' }} />
                    <span>{t.priceTrends?.chartLegendPrice || 'Actual Modal Price'}</span>
                  </div>
                  {trendData?.sma_7 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#d97706' }}>
                      <span style={{ width: '12px', height: '2px', borderTop: '2px dashed #d97706' }} />
                      <span>{t.priceTrends?.chartLegendSma7 || '7-Obs SMA'}</span>
                    </div>
                  )}
                  {trendData?.sma_14 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#7c3aed' }}>
                      <span style={{ width: '12px', height: '2px', borderTop: '2px dotted #7c3aed' }} />
                      <span>{t.priceTrends?.chartLegendSma14 || '14-Obs SMA'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Responsive SVG Canvas */}
              <div style={{ width: '100%', overflowX: 'auto' }}>
                <svg
                  viewBox={`0 0 ${chartMetrics.width} ${chartMetrics.height}`}
                  style={{ width: '100%', height: 'auto', minWidth: '460px', display: 'block' }}
                >
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#166534" stopOpacity="0.22" />
                      <stop offset="100%" stopColor="#166534" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid Lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                    const yVal = chartMetrics.yMin + ratio * (chartMetrics.yMax - chartMetrics.yMin);
                    const yPos = chartMetrics.padTop + chartMetrics.plotH - ratio * chartMetrics.plotH;
                    return (
                      <g key={ratio}>
                        <line
                          x1={chartMetrics.padLeft}
                          y1={yPos}
                          x2={chartMetrics.width - chartMetrics.padRight}
                          y2={yPos}
                          stroke="#f1f5f9"
                          strokeDasharray="4 4"
                        />
                        <text
                          x={chartMetrics.padLeft - 8}
                          y={yPos + 4}
                          textAnchor="end"
                          fontSize="10"
                          fill="#94a3b8"
                          fontWeight="600"
                        >
                          ₹{formatPrice(yVal)}
                        </text>
                      </g>
                    );
                  })}

                  {/* Shaded Area fill under modal price line */}
                  {chartMetrics.areaD && <path d={chartMetrics.areaD} fill="url(#areaGradient)" />}

                  {/* Actual Modal Price Line */}
                  {chartMetrics.pathD && (
                    <path
                      d={chartMetrics.pathD}
                      fill="none"
                      stroke="#166534"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Data Points */}
                  {chartMetrics.points.map((pt, idx) => (
                    <g key={idx}>
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={hoveredPoint?.date === pt.date ? 6 : 4.5}
                        fill="#ffffff"
                        stroke="#166534"
                        strokeWidth="3"
                        style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                        onMouseEnter={() => setHoveredPoint(pt)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                      {/* X-axis date labels */}
                      <text
                        x={pt.x}
                        y={chartMetrics.height - 10}
                        textAnchor="middle"
                        fontSize="10"
                        fill="#64748b"
                        fontWeight="600"
                      >
                        {pt.date}
                      </text>
                      {/* Price callout on single point */}
                      {chartMetrics.points.length === 1 && (
                        <text
                          x={pt.x}
                          y={pt.y - 12}
                          textAnchor="middle"
                          fontSize="11"
                          fill="#166534"
                          fontWeight="800"
                        >
                          ₹{formatPrice(pt.price)}/Qtl
                        </text>
                      )}
                    </g>
                  ))}
                </svg>
              </div>

              {/* Notice when SMA is unavailable */}
              {!trendData?.sma_7 && observations.length > 0 && (
                <div style={{ marginTop: '0.85rem', fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic', textAlign: 'center' }}>
                  ℹ️ {t.priceTrends?.chartNoSmaNotice || 'Moving averages require 7+ observations (7-SMA) and 14+ observations (14-SMA).'}
                </div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* 10. Data Quality Warnings & Integrity Notice                */}
          {/* ============================================================ */}
          {(confidence?.confidence_reasons?.length > 0 || trendSummary?.data_quality_warnings?.length > 0) && (
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '1rem 1.25rem',
                fontSize: '0.82rem',
                color: '#334155'
              }}
            >
              <div style={{ fontWeight: 800, color: '#0f381e', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>🛡️</span>
                <span>{t.priceTrends?.qualityWarning || 'Data Quality Notice & Confidence Assessment'}</span>
              </div>
              <ul style={{ margin: '0.25rem 0 0 1.25rem', padding: 0, lineHeight: 1.5 }}>
                {confidence?.confidence_reasons?.map((reason, i) => (
                  <li key={i}>{reason}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
