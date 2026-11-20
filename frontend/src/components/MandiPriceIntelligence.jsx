import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from '../i18n';
import { getMandiPrices, getMandiFilters, getMandiSummary, syncMandiData } from '../services/api';
import assetPath from '../utils/assetPath';

export default function MandiPriceIntelligence() {
  const { t } = useTranslation();

  // State management
  const [prices, setPrices] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Summary statistics
  const [summary, setSummary] = useState(null);

  // Filter options from backend
  const [filterOptions, setFilterOptions] = useState({
    states: [],
    districts: [],
    markets: [],
    commodities: []
  });

  // Active filter selections
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedMarket, setSelectedMarket] = useState('');
  const [selectedCommodity, setSelectedCommodity] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load filter options (cascaded by state)
  const fetchFilterOptions = useCallback(async (stateFilter = '') => {
    try {
      const filters = await getMandiFilters(stateFilter);
      setFilterOptions((prev) => ({
        ...prev,
        states: filters.states || prev.states || [],
        districts: filters.districts || [],
        markets: filters.markets || [],
        commodities: filters.commodities || prev.commodities || []
      }));
    } catch (err) {
      console.warn('Failed to load mandi filter options:', err);
    }
  }, []);

  // Initial load of filters and summary
  useEffect(() => {
    fetchFilterOptions('');
    (async () => {
      try {
        const sum = await getMandiSummary();
        setSummary(sum);
      } catch (err) {
        console.warn('Failed to load mandi summary:', err);
      }
    })();
  }, [fetchFilterOptions]);

  // Re-fetch child filters whenever state changes
  useEffect(() => {
    fetchFilterOptions(selectedState);
    setSelectedDistrict('');
    setSelectedMarket('');
    setCurrentPage(1);
  }, [selectedState, fetchFilterOptions]);

  // Fetch prices based on active filters
  const fetchPrices = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await getMandiPrices({
        search: debouncedSearch,
        state: selectedState,
        district: selectedDistrict,
        market: selectedMarket,
        commodity: selectedCommodity,
        sort: sortBy,
        page: currentPage,
        limit: 12
      });

      if (res && res.records) {
        setPrices(res.records);
        setTotalRecords(res.total || 0);
        setTotalPages(res.pages || 1);
      } else {
        setPrices([]);
        setTotalRecords(0);
        setTotalPages(1);
      }
    } catch (err) {
      console.error('Error fetching mandi prices:', err);
      setErrorMsg(t.mandi?.errorTitle || 'Unable to connect to market intelligence service. Please check if backend is running.');
      setPrices([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedState, selectedDistrict, selectedMarket, selectedCommodity, sortBy, currentPage, t]);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  // Handle manual sync / refresh
  const handleSync = async () => {
    if (syncing) return;
    setSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await syncMandiData();
      const updatedSummary = await getMandiSummary();
      setSummary(updatedSummary);
      await fetchPrices();

      const count = res?.count || res?.records_updated || 0;
      const isFallback = res?.status === 'OFFLINE_FALLBACK' || res?.status === 'cached';
      setSyncFeedback({
        type: isFallback ? 'info' : 'success',
        msg: isFallback
          ? `${t.mandi?.syncFallback || 'Using verified Agmarknet baseline data (Offline Mode).'} (${count} records)`
          : `${t.mandi?.syncSuccess || 'Mandi prices refreshed successfully!'} (${count} records)`
      });
    } catch (err) {
      console.error('Mandi sync error:', err);
      setSyncFeedback({
        type: 'error',
        msg: err.message || 'Mandi synchronization failed. Please try again later.'
      });
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncFeedback(null), 7000);
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedState('');
    setSelectedDistrict('');
    setSelectedMarket('');
    setSelectedCommodity('');
    setSortBy('date_desc');
    setCurrentPage(1);
  };

  // Format currency in Indian Rupees
  const formatPrice = (val) => {
    if (val === null || val === undefined || isNaN(val)) return '—';
    return Number(val).toLocaleString('en-IN', {
      maximumFractionDigits: 0
    });
  };

  // Helper for source badges
  const getSourceBadge = (sourceType, sourceLabel) => {
    if (sourceType === 'official_data_gov_in_api') {
      return {
        text: sourceLabel || t.mandi?.sourceLive || 'Govt Live API',
        bg: 'rgba(16, 185, 129, 0.12)',
        color: '#065f46',
        border: 'rgba(16, 185, 129, 0.28)',
        icon: '🟢'
      };
    }
    return {
      text: sourceLabel || t.mandi?.sourceVerified || 'Agmarknet Baseline',
      bg: 'rgba(217, 119, 6, 0.1)',
      color: '#92400e',
      border: 'rgba(217, 119, 6, 0.25)',
      icon: '🏛️'
    };
  };

  const hasActiveFilters = useMemo(() => {
    return Boolean(searchQuery || selectedState || selectedDistrict || selectedMarket || selectedCommodity || sortBy !== 'date_desc');
  }, [searchQuery, selectedState, selectedDistrict, selectedMarket, selectedCommodity, sortBy]);

  return (
    <div
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
      {/* Decorative Botanical Leaf Watermark */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '-20px',
          right: '-20px',
          width: '160px',
          height: 'auto',
          opacity: 0.06,
          pointerEvents: 'none',
          zIndex: 0
        }}
      >
        <img
          src={assetPath('/images/real-leaf-2.png')}
          alt=""
          style={{ width: '100%', height: 'auto', transform: 'rotate(25deg)' }}
        />
      </div>

      {/* ============================================================ */}
      {/* 1. Header & Live Sync Controls                               */}
      {/* ============================================================ */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1.25rem',
          marginBottom: '1.75rem',
          position: 'relative',
          zIndex: 1
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#166534',
                background: 'rgba(22, 101, 52, 0.08)',
                padding: '0.25rem 0.65rem',
                borderRadius: '999px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <span>📊</span>
              <span>{t.mandi?.badge || 'Smart Market Intelligence'}</span>
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
              {t.mandi?.perQuintal || '₹ / Quintal'}
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
            {t.mandi?.heading || 'Agricultural Mandi Prices & APMC Rates'}
          </h2>
          <p
            style={{
              fontSize: '0.9rem',
              color: '#475569',
              margin: 0,
              maxWidth: '680px',
              lineHeight: 1.5
            }}
          >
            {t.mandi?.subtitle || 'Official wholesale agricultural market rates across Indian APMCs with verified baseline & live sync.'}
          </p>
        </div>

        {/* Sync / Refresh Button */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.55rem',
              background: syncing ? '#e2e8f0' : 'linear-gradient(135deg, #166534 0%, #15803d 100%)',
              color: syncing ? '#64748b' : '#ffffff',
              border: 'none',
              borderRadius: '14px',
              padding: '0.65rem 1.15rem',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: syncing ? 'not-allowed' : 'pointer',
              boxShadow: syncing ? 'none' : '0 4px 14px rgba(22, 101, 52, 0.25)',
              transition: 'all 0.2s ease'
            }}
          >
            <span
              style={{
                display: 'inline-block',
                transform: syncing ? 'rotate(360deg)' : 'none',
                transition: syncing ? 'transform 1s linear infinite' : 'none'
              }}
            >
              🔄
            </span>
            <span>{syncing ? (t.mandi?.syncing || 'Syncing...') : (t.mandi?.refreshBtn || 'Refresh Rates')}</span>
          </button>

          {summary?.last_sync?.sync_time && (
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              {t.mandi?.lastSync || 'Last Sync'}: {new Date(summary.last_sync.sync_time).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          )}
        </div>
      </div>

      {/* Feedback Banner */}
      {syncFeedback && (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '12px',
            marginBottom: '1.25rem',
            fontSize: '0.86rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: syncFeedback.type === 'success'
              ? 'rgba(16, 185, 129, 0.12)'
              : syncFeedback.type === 'info'
              ? 'rgba(59, 130, 246, 0.12)'
              : 'rgba(239, 68, 68, 0.12)',
            color: syncFeedback.type === 'success'
              ? '#065f46'
              : syncFeedback.type === 'info'
              ? '#1e40af'
              : '#991b1b',
            border: `1px solid ${
              syncFeedback.type === 'success'
                ? 'rgba(16, 185, 129, 0.3)'
                : syncFeedback.type === 'info'
                ? 'rgba(59, 130, 246, 0.3)'
                : 'rgba(239, 68, 68, 0.3)'
            }`
          }}
        >
          <span>{syncFeedback.type === 'error' ? '⚠️' : 'ℹ️'}</span>
          <span>{syncFeedback.msg}</span>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. Market Overview Cards                                     */}
      {/* ============================================================ */}
      {summary && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '0.85rem',
            marginBottom: '1.5rem',
            position: 'relative',
            zIndex: 1
          }}
        >
          {/* Card 1: Mandis */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '0.85rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'rgba(22, 101, 52, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                flexShrink: 0
              }}
            >
              🏛️
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f381e', lineHeight: 1.1 }}>
                {summary.total_markets || 0}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                {t.mandi?.statMarkets || 'Mandis Monitored'}
              </div>
            </div>
          </div>

          {/* Card 2: Commodities */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '0.85rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'rgba(234, 179, 8, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                flexShrink: 0
              }}
            >
              🌾
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f381e', lineHeight: 1.1 }}>
                {summary.total_commodities || 0}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                {t.mandi?.statCommodities || 'Crops Tracked'}
              </div>
            </div>
          </div>

          {/* Card 3: States */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '0.85rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'rgba(59, 130, 246, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                flexShrink: 0
              }}
            >
              📍
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f381e', lineHeight: 1.1 }}>
                {summary.total_states || 0}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                {t.mandi?.statStates || 'States Covered'}
              </div>
            </div>
          </div>

          {/* Card 4: Overall Avg Modal Price */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '0.85rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                flexShrink: 0
              }}
            >
              💰
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f381e', lineHeight: 1.1 }}>
                ₹{formatPrice(summary.overall_avg_price)}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                {t.mandi?.statAvgPrice || 'Avg Modal Price (Qtl)'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Benchmark Chips */}
      {summary?.top_commodities && summary.top_commodities.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            overflowX: 'auto',
            paddingBottom: '0.75rem',
            marginBottom: '1.25rem',
            scrollbarWidth: 'thin'
          }}
        >
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap' }}>
            {t.mandi?.marketInsights || 'Benchmark Rates'}:
          </span>
          {summary.top_commodities.slice(0, 6).map((item) => (
            <button
              key={item.commodity}
              type="button"
              onClick={() => {
                setSelectedCommodity(item.commodity);
                setCurrentPage(1);
              }}
              style={{
                background: selectedCommodity === item.commodity ? '#166534' : '#ffffff',
                color: selectedCommodity === item.commodity ? '#ffffff' : '#1e293b',
                border: selectedCommodity === item.commodity ? '1px solid #166534' : '1px solid #cbd5e1',
                borderRadius: '999px',
                padding: '0.28rem 0.75rem',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.15s ease'
              }}
            >
              <span>{item.commodity}</span>
              <span
                style={{
                  fontWeight: 700,
                  color: selectedCommodity === item.commodity ? '#86efac' : '#166534'
                }}
              >
                ₹{formatPrice(item.avg_price)}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. Search and Multi-Level Filter Controls                    */}
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
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '0.85rem',
            alignItems: 'center'
          }}
        >
          {/* Search Box */}
          <div style={{ position: 'relative' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>
              🔍 {t.mandi?.filterCommodity || 'Search Crop / Mandi'}
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.mandi?.searchPlaceholder || 'Search crop or mandi...'}
              style={{
                width: '100%',
                padding: '0.6rem 2.2rem 0.6rem 0.85rem',
                fontSize: '0.86rem',
                border: '1px solid #cbd5e1',
                borderRadius: '12px',
                outline: 'none',
                background: '#ffffff',
                color: '#0f172a'
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '26px',
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  padding: '2px'
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* State Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>
              📍 {t.mandi?.filterState || 'State'}
            </label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 0.85rem',
                fontSize: '0.86rem',
                border: '1px solid #cbd5e1',
                borderRadius: '12px',
                outline: 'none',
                background: '#ffffff',
                color: '#0f172a',
                cursor: 'pointer'
              }}
            >
              <option value="">{t.mandi?.allStates || 'All States'}</option>
              {filterOptions.states.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* District Filter (Cascaded) */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>
              🗺️ {t.mandi?.filterDistrict || 'District'}
            </label>
            <select
              value={selectedDistrict}
              onChange={(e) => {
                setSelectedDistrict(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                width: '100%',
                padding: '0.6rem 0.85rem',
                fontSize: '0.86rem',
                border: '1px solid #cbd5e1',
                borderRadius: '12px',
                outline: 'none',
                background: '#ffffff',
                color: '#0f172a',
                cursor: 'pointer'
              }}
            >
              <option value="">{t.mandi?.allDistricts || 'All Districts'}</option>
              {filterOptions.districts.map((dist) => (
                <option key={dist} value={dist}>
                  {dist}
                </option>
              ))}
            </select>
          </div>

          {/* Commodity Dropdown */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>
              🌱 {t.mandi?.commodity || 'Crop'}
            </label>
            <select
              value={selectedCommodity}
              onChange={(e) => {
                setSelectedCommodity(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                width: '100%',
                padding: '0.6rem 0.85rem',
                fontSize: '0.86rem',
                border: '1px solid #cbd5e1',
                borderRadius: '12px',
                outline: 'none',
                background: '#ffffff',
                color: '#0f172a',
                cursor: 'pointer'
              }}
            >
              <option value="">{t.mandi?.allCommodities || 'All Crops'}</option>
              {filterOptions.commodities.map((comm) => (
                <option key={comm} value={comm}>
                  {comm}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>
              ↕️ {t.mandi?.sortBy || 'Sort By'}
            </label>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                width: '100%',
                padding: '0.6rem 0.85rem',
                fontSize: '0.86rem',
                border: '1px solid #cbd5e1',
                borderRadius: '12px',
                outline: 'none',
                background: '#ffffff',
                color: '#0f172a',
                cursor: 'pointer'
              }}
            >
              <option value="date_desc">{t.mandi?.sortDateDesc || 'Latest Arrival Date'}</option>
              <option value="price_desc">{t.mandi?.sortPriceDesc || 'Modal Price: High to Low'}</option>
              <option value="price_asc">{t.mandi?.sortPriceAsc || 'Modal Price: Low to High'}</option>
              <option value="commodity_asc">{t.mandi?.sortCommodityAsc || 'Crop Name (A-Z)'}</option>
            </select>
          </div>
        </div>

        {/* Clear Filters Row */}
        {hasActiveFilters && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
            <button
              type="button"
              onClick={handleResetFilters}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#166534',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <span>✕</span>
              <span>{t.mandi?.resetFilters || 'Reset Filters'}</span>
            </button>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 4. Price Intelligence Records                                */}
      {/* ============================================================ */}

      {/* Loading State */}
      {loading ? (
        <div style={{ padding: '3.5rem 1rem', textAlign: 'center' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              border: '3px solid #e2e8f0',
              borderTopColor: '#166534',
              borderRadius: '50%',
              margin: '0 auto 1rem auto',
              animation: 'spin 0.8s linear infinite'
            }}
          />
          <div style={{ fontSize: '0.92rem', color: '#64748b', fontWeight: 600 }}>
            {t.mandi?.loading || 'Loading agricultural mandi prices...'}
          </div>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      ) : errorMsg ? (
        /* Error State */
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
          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#991b1b', marginBottom: '0.35rem' }}>
            {errorMsg}
          </div>
          <button
            type="button"
            onClick={fetchPrices}
            style={{
              marginTop: '0.75rem',
              background: '#166534',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              padding: '0.5rem 1.25rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {t.mandi?.retry || 'Retry'}
          </button>
        </div>
      ) : prices.length === 0 ? (
        /* Empty State */
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
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.35rem' }}>
            {t.mandi?.noResultsTitle || 'No Mandi records found'}
          </div>
          <div style={{ fontSize: '0.88rem', color: '#64748b', maxWidth: '440px', margin: '0 auto 1.25rem auto' }}>
            {t.mandi?.noResultsSub || 'Try clearing some search filters or selecting another crop / state.'}
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              style={{
                background: '#166534',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding: '0.6rem 1.35rem',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {t.mandi?.resetFilters || 'Reset Filters'}
            </button>
          )}
        </div>
      ) : (
        /* Data Grid / Cards */
        <div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
              gap: '1.15rem',
              marginBottom: '1.75rem'
            }}
          >
            {prices.map((record) => {
              const badge = getSourceBadge(record.source_type, record.source_label);
              return (
                <div
                  key={record.id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid rgba(22, 101, 52, 0.14)',
                    borderRadius: '20px',
                    padding: '1.25rem',
                    boxShadow: '0 4px 16px rgba(15, 56, 30, 0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                  }}
                >
                  {/* Top: Commodity & Source Badge */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <div>
                        <div style={{ fontSize: '1.18rem', fontWeight: 800, color: '#0f381e' }}>
                          {record.commodity}
                        </div>
                        {record.variety && (
                          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                            {t.mandi?.variety || 'Variety'}: {record.variety}
                          </div>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          background: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`,
                          padding: '0.2rem 0.55rem',
                          borderRadius: '999px',
                          whiteSpace: 'nowrap',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        <span>{badge.icon}</span>
                        <span>{badge.text}</span>
                      </span>
                    </div>

                    {/* Market & Location */}
                    <div
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #f1f5f9',
                        borderRadius: '12px',
                        padding: '0.6rem 0.75rem',
                        marginBottom: '0.85rem'
                      }}
                    >
                      <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#1e293b' }}>
                        🏛️ {record.market}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.15rem' }}>
                        📍 {record.district}, {record.state}
                      </div>
                    </div>
                  </div>

                  {/* Price Matrix */}
                  <div>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1.35fr 1fr',
                        gap: '0.4rem',
                        background: '#f8fafc',
                        borderRadius: '14px',
                        padding: '0.65rem 0.5rem',
                        textAlign: 'center',
                        marginBottom: '0.75rem',
                        border: '1px solid #e2e8f0'
                      }}
                    >
                      {/* Min Price */}
                      <div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>
                          {t.mandi?.minPrice || 'Min'}
                        </div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#334155' }}>
                          ₹{formatPrice(record.min_price)}
                        </div>
                      </div>

                      {/* Modal Price (Primary Highlight) */}
                      <div
                        style={{
                          background: 'rgba(22, 101, 52, 0.1)',
                          border: '1px solid rgba(22, 101, 52, 0.25)',
                          borderRadius: '10px',
                          padding: '0.2rem 0.35rem'
                        }}
                      >
                        <div style={{ fontSize: '0.7rem', color: '#166534', fontWeight: 800, textTransform: 'uppercase' }}>
                          ★ {t.mandi?.modalPrice || 'Modal'}
                        </div>
                        <div style={{ fontSize: '1.12rem', fontWeight: 900, color: '#166534' }}>
                          ₹{formatPrice(record.modal_price)}
                        </div>
                      </div>

                      {/* Max Price */}
                      <div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>
                          {t.mandi?.maxPrice || 'Max'}
                        </div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#334155' }}>
                          ₹{formatPrice(record.max_price)}
                        </div>
                      </div>
                    </div>

                    {/* Footer Info: Unit & Arrival Date */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.74rem',
                        color: '#64748b'
                      }}
                    >
                      <span>🏷️ {record.unit || 'Rs/Quintal'}</span>
                      <span>📅 {t.mandi?.arrivalDate || 'Arrival'}: {record.arrival_date}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ============================================================ */}
          {/* 5. Pagination Bar                                            */}
          {/* ============================================================ */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid #e2e8f0'
            }}
          >
            <div style={{ fontSize: '0.84rem', color: '#64748b', fontWeight: 600 }}>
              {t.mandi?.paginationShowing
                ? t.mandi.paginationShowing
                    .replace('{from}', (currentPage - 1) * 12 + 1)
                    .replace('{to}', Math.min(currentPage * 12, totalRecords))
                    .replace('{total}', totalRecords)
                : `Showing ${(currentPage - 1) * 12 + 1} - ${Math.min(currentPage * 12, totalRecords)} of ${totalRecords} records`}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                style={{
                  background: currentPage <= 1 ? '#f1f5f9' : '#ffffff',
                  color: currentPage <= 1 ? '#94a3b8' : '#0f172a',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '0.45rem 0.95rem',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: currentPage <= 1 ? 'not-allowed' : 'pointer'
                }}
              >
                ← {t.mandi?.prevPage || 'Previous'}
              </button>

              <span
                style={{
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: '#166534',
                  background: 'rgba(22, 101, 52, 0.08)',
                  borderRadius: '10px'
                }}
              >
                {currentPage} / {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                style={{
                  background: currentPage >= totalPages ? '#f1f5f9' : '#ffffff',
                  color: currentPage >= totalPages ? '#94a3b8' : '#0f172a',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '0.45rem 0.95rem',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer'
                }}
              >
                {t.mandi?.nextPage || 'Next'} →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 6. Legal & Official Data Attribution Footnote                */}
      {/* ============================================================ */}
      <div
        style={{
          marginTop: '1.75rem',
          paddingTop: '1rem',
          borderTop: '1px solid rgba(22, 101, 52, 0.08)',
          fontSize: '0.75rem',
          color: '#64748b',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          lineHeight: 1.4
        }}
      >
        <span>🏛️</span>
        <span>
          {t.mandi?.disclaimer ||
            'Market price intelligence sourced from Agmarknet / Directorate of Marketing & Inspection (Govt of India). Cached offline in SQLite for reliable field access.'}
        </span>
      </div>
    </div>
  );
}
