import React, { useState } from 'react';
import { useTranslation } from '../i18n';
import LoadingState from './LoadingState';
import { checkLeaf } from '../services/api';
import assetPath from '../utils/assetPath';

export default function LeafHealth() {
  const { t } = useTranslation();

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setResult(null);
      setErrorMsg(null);
      
      // Auto trigger analysis or allow manual check
      setLoading(true);
      try {
        const data = await checkLeaf(file);
        setResult(data);
      } catch (err) {
        console.warn('Leaf check API error:', err);
        setErrorMsg(t.leaf?.errorMsg || 'Failed to analyze leaf image. Please ensure the image is clear and try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setResult(null);
    setErrorMsg(null);
  };

  // Helper to format raw dataset labels nicely
  const formatDiseaseName = (rawName) => {
    if (!rawName) return '';
    return rawName
      .replace(/___/g, ' — ')
      .replace(/__/g, ' — ')
      .replace(/_/g, ' ');
  };

  const isHealthy = result?.predicted_disease?.toLowerCase().includes('healthy');

  return (
    <div
      className="agri-feature-card"
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
            src={assetPath("/images/agriai-emblem-transparent.png")}
            alt="AgriAI Leaf Health"
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
            {t.leaf?.heading || 'Check Your Plant'}
          </h3>
          <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '2px 0 0' }}>
            {t.leaf?.subtitle || 'Upload a clear photo of the affected leaf.'}
          </p>
        </div>
      </div>

      {/* Card Body: Left Upload Zone + Right Leaf Image & Diagnosis */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.35fr) minmax(0, 1fr)',
          gap: '1.25rem',
          flex: 1,
          alignItems: 'stretch'
        }}
        className="leaf-card-grid"
      >
        {/* Left Side: Upload Dropzone Area */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {!previewUrl ? (
            <label
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1.5rem 1rem',
                borderRadius: '18px',
                border: '1.5px dashed #86efac',
                background: 'rgba(240, 253, 244, 0.6)',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s ease',
                minHeight: '210px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#16a34a';
                e.currentTarget.style.background = '#f0fdf4';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#86efac';
                e.currentTarget.style.background = 'rgba(240, 253, 244, 0.6)';
              }}
            >
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <div style={{ fontSize: '2.2rem', marginBottom: '0.45rem' }}>🍃</div>
              <div style={{ fontWeight: 700, fontSize: '0.94rem', color: '#0f381e', marginBottom: '0.65rem' }}>
                {t.leaf?.uploadTitle || 'Upload your leaf photo'}
              </div>
              <div
                style={{
                  display: 'inline-block',
                  padding: '0.5rem 1.25rem',
                  borderRadius: 'var(--radius-full)',
                  background: 'linear-gradient(135deg, #1b5e20, #2e7d32)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  marginBottom: '0.5rem',
                  boxShadow: '0 3px 10px rgba(27, 94, 32, 0.25)'
                }}
              >
                {t.leaf?.chooseBtn || 'Choose Image'}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                JPG, PNG, WEBP (Up to 10MB)
              </div>
            </label>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
              <div
                style={{
                  position: 'relative',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: '1px solid #e2e8f0',
                  height: '160px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#0f172a'
                }}
              >
                <img
                  src={previewUrl}
                  alt="Leaf preview"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.45rem 0.65rem',
                  background: '#f8fafc',
                  borderRadius: '10px',
                  fontSize: '0.8rem',
                  marginTop: '0.5rem'
                }}
              >
                <span style={{ fontWeight: 600, color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>
                  {selectedFile?.name}
                </span>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  style={{
                    color: '#dc2626',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    background: '#fef2f2',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '6px',
                    border: '1px solid #fee2e2',
                    cursor: 'pointer'
                  }}
                >
                  {t.leaf?.removeImage || 'Remove'}
                </button>
              </div>

              <label
                style={{
                  marginTop: '0.5rem',
                  padding: '0.55rem',
                  borderRadius: 'var(--radius-full)',
                  background: '#f0fdf4',
                  border: '1px solid #86efac',
                  color: '#166534',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  display: 'block'
                }}
              >
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                📷 Upload Another Leaf
              </label>
            </div>
          )}
        </div>

        {/* Right Side: Leaf Graphic + Result / Diagnosis Display */}
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
          {/* Leaf Illustration */}
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center', margin: '0.25rem 0' }}>
            <img
              src={assetPath("/images/real-leaf-2.png")}
              alt="Leaf Pathology"
              style={{
                maxHeight: '120px',
                width: 'auto',
                objectFit: 'contain',
                filter: 'drop-shadow(0 6px 12px rgba(15, 56, 30, 0.12))'
              }}
            />
          </div>

          {/* Result or Waiting State */}
          <div style={{ width: '100%', textAlign: 'center', paddingTop: '0.4rem', borderTop: '1px solid rgba(22, 101, 52, 0.08)' }}>
            {loading ? (
              <div style={{ padding: '0.5rem 0' }}>
                <LoadingState message={t.leaf?.loading || "Diagnosing..."} />
              </div>
            ) : errorMsg ? (
              <div style={{ fontSize: '0.78rem', color: '#dc2626', fontWeight: 600 }}>
                ⚠️ {errorMsg}
              </div>
            ) : result ? (
              <div style={{ animation: 'fadeIn 0.3s ease' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <div style={{ fontSize: '0.75rem', color: isHealthy ? '#166534' : '#c2410c', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span>🍃</span> {isHealthy ? 'Healthy Leaf' : 'Pathology Detected'}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: isHealthy ? '#166534' : '#c2410c', fontWeight: 800, background: isHealthy ? '#dcfce7' : '#ffedd5', padding: '0.15rem 0.5rem', borderRadius: '10px' }}>
                    {result.confidence}%
                  </div>
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f381e', textAlign: 'left', lineHeight: 1.3 }}>
                  {formatDiseaseName(result.predicted_disease)}
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span>🍃</span> Ready for Scan
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#166534', fontWeight: 800, background: '#dcfce7', padding: '0.15rem 0.5rem', borderRadius: '10px' }}>
                    AI Ready
                  </div>
                </div>
                <div style={{ fontSize: '0.86rem', color: '#64748b', textAlign: 'left', lineHeight: 1.3 }}>
                  Upload a photo to detect leaf infections or verify health.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
