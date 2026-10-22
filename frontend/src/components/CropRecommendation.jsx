import React, { useState } from 'react';
import { useTranslation } from '../i18n';
import LoadingState from './LoadingState';
import { recommendCrop } from '../services/api';

export default function CropRecommendation() {
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    N: 90,
    P: 42,
    K: 43,
    temperature: 25.0,
    humidity: 82.0,
    ph: 6.5,
    rainfall: 200.0,
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setResult(null);

    try {
      const data = await recommendCrop(formData);
      setResult(data);
    } catch (err) {
      console.warn('Crop recommendation API error:', err);
      setErrorMsg(t.crop?.errorMsg || 'Failed to generate crop recommendation. Please check your inputs or try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '26px',
        border: '1px solid rgba(22, 101, 52, 0.12)',
        boxShadow: '0 16px 40px -8px rgba(15, 56, 30, 0.07)',
        padding: '1.65rem 1.75rem',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}
    >
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '12px',
            background: '#ffffff',
            border: '1px solid rgba(22, 101, 52, 0.16)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2px',
            boxShadow: '0 2px 8px rgba(15, 56, 30, 0.12)',
            flexShrink: 0,
            overflow: 'hidden'
          }}
        >
          <img
            src="/images/agriai-emblem-transparent.png"
            alt="AgriAI Crop Advisory"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>
        <div>
          <h3
            style={{
              fontSize: '1.15rem',
              fontWeight: 800,
              color: '#0f381e',
              lineHeight: 1.2,
              margin: 0
            }}
          >
            {t.crop?.heading || 'Grow the Right Crop'}
          </h3>
          <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '2px 0 0' }}>
            {t.crop?.subtitle || 'Enter your soil and weather information.'}
          </p>
        </div>
      </div>

      {/* Card Body: Left Inputs + Right Visual & Result */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.45fr) minmax(0, 1fr)',
          gap: '1.25rem',
          flex: 1,
          alignItems: 'stretch'
        }}
        className="crop-card-grid"
      >
        {/* Left Side: Input Fields Grid */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {/* Row 1: Nitrogen, Phosphorus, Potassium */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
            <div style={{ background: '#f8fafc', padding: '0.45rem 0.6rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '2px' }}>
                <span>🌾</span> Nitrogen (N)
              </div>
              <input
                type="number"
                name="N"
                value={formData.N}
                onChange={handleChange}
                required
                min="0"
                max="200"
                step="any"
                style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', fontWeight: 700, fontSize: '0.92rem', color: '#0f172a' }}
              />
            </div>

            <div style={{ background: '#f8fafc', padding: '0.45rem 0.6rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '2px' }}>
                <span>🧪</span> Phosphorus (P)
              </div>
              <input
                type="number"
                name="P"
                value={formData.P}
                onChange={handleChange}
                required
                min="0"
                max="200"
                step="any"
                style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', fontWeight: 700, fontSize: '0.92rem', color: '#0f172a' }}
              />
            </div>

            <div style={{ background: '#f8fafc', padding: '0.45rem 0.6rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '2px' }}>
                <span>🪨</span> Potassium (K)
              </div>
              <input
                type="number"
                name="K"
                value={formData.K}
                onChange={handleChange}
                required
                min="0"
                max="250"
                step="any"
                style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', fontWeight: 700, fontSize: '0.92rem', color: '#0f172a' }}
              />
            </div>
          </div>

          {/* Row 2: Temperature, Humidity, Soil pH */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
            <div style={{ background: '#f8fafc', padding: '0.45rem 0.6rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '2px' }}>
                <span>🌡️</span> Temp (°C)
              </div>
              <input
                type="number"
                name="temperature"
                value={formData.temperature}
                onChange={handleChange}
                required
                step="any"
                style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', fontWeight: 700, fontSize: '0.92rem', color: '#0f172a' }}
              />
            </div>

            <div style={{ background: '#f8fafc', padding: '0.45rem 0.6rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '2px' }}>
                <span>💧</span> Humidity (%)
              </div>
              <input
                type="number"
                name="humidity"
                value={formData.humidity}
                onChange={handleChange}
                required
                min="0"
                max="100"
                step="any"
                style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', fontWeight: 700, fontSize: '0.92rem', color: '#0f172a' }}
              />
            </div>

            <div style={{ background: '#f8fafc', padding: '0.45rem 0.6rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '2px' }}>
                <span>⚖️</span> Soil pH
              </div>
              <input
                type="number"
                name="ph"
                value={formData.ph}
                onChange={handleChange}
                required
                min="0"
                max="14"
                step="0.1"
                style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', fontWeight: 700, fontSize: '0.92rem', color: '#0f172a' }}
              />
            </div>
          </div>

          {/* Row 3: Rainfall */}
          <div style={{ background: '#f8fafc', padding: '0.45rem 0.6rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '2px' }}>
              <span>🌧️</span> Rainfall (mm)
            </div>
            <input
              type="number"
              name="rainfall"
              value={formData.rainfall}
              onChange={handleChange}
              required
              min="0"
              step="any"
              style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', fontWeight: 700, fontSize: '0.92rem', color: '#0f172a' }}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '0.4rem',
              padding: '0.7rem 1.25rem',
              borderRadius: 'var(--radius-full)',
              background: 'linear-gradient(135deg, #1b5e20, #2e7d32)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
              border: 'none',
              cursor: loading ? 'wait' : 'pointer',
              boxShadow: '0 4px 14px rgba(27, 94, 32, 0.25)',
              transition: 'all 0.2s ease'
            }}
          >
            <span>🌱</span>
            <span>{loading ? (t.crop?.loading || 'Analyzing...') : (t.crop?.submitBtn || 'Recommend Crop')}</span>
          </button>
        </form>

        {/* Right Side: Crop Plant Sprout Graphic + Result Display */}
        <div
          style={{
            background: 'linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%)',
            borderRadius: '20px',
            border: '1px solid rgba(22, 101, 52, 0.1)',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Sprout Image */}
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center', margin: '0.25rem 0' }}>
            <img
              src="/images/real-crop-plant.png"
              alt="Crop Sprout"
              style={{
                maxHeight: '120px',
                width: 'auto',
                objectFit: 'contain',
                filter: 'drop-shadow(0 6px 12px rgba(15, 56, 30, 0.12))'
              }}
            />
          </div>

          {/* Result or Default Preview */}
          <div style={{ width: '100%', textAlign: 'center', paddingTop: '0.4rem', borderTop: '1px solid rgba(22, 101, 52, 0.08)' }}>
            {loading ? (
              <div style={{ padding: '0.5rem 0' }}>
                <LoadingState message={t.crop?.loading || "Analyzing..."} />
              </div>
            ) : errorMsg ? (
              <div style={{ fontSize: '0.78rem', color: '#dc2626', fontWeight: 600 }}>
                ⚠️ {errorMsg}
              </div>
            ) : result ? (
              <div style={{ animation: 'fadeIn 0.3s ease' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span>🌱</span> Recommended Crop
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#166534', fontWeight: 800, background: '#dcfce7', padding: '0.15rem 0.5rem', borderRadius: '10px' }}>
                    {result.confidence}%
                  </div>
                </div>
                <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0f381e', textTransform: 'capitalize', textAlign: 'left' }}>
                  🌾 {result.recommended_crop}
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span>🌱</span> Recommended Crop
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#166534', fontWeight: 800, background: '#dcfce7', padding: '0.15rem 0.5rem', borderRadius: '10px' }}>
                    93.5%
                  </div>
                </div>
                <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0f381e', textTransform: 'capitalize', textAlign: 'left' }}>
                  🌾 Rice
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
