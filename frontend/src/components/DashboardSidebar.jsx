import React from 'react';
import { useTranslation } from '../i18n';
import {
  LayoutDashboard,
  Bot,
  Sprout,
  ShieldAlert,
  CloudSun,
  Mic,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  X
} from 'lucide-react';
import assetPath from '../utils/assetPath';
import { getOrAssignUserAvatar } from '../services/avatar';

export default function DashboardSidebar({
  user,
  activeTab = 'overview',
  onTabChange,
  collapsed = false,
  onToggleCollapse,
  mobileOpen = false,
  onCloseMobile
}) {
  const { t } = useTranslation();
  const avatar = getOrAssignUserAvatar(user);

  const navSections = [
    {
      label: t('dashboard.navSectionMain') || 'Navigation',
      items: [
        { id: 'overview', label: t('dashboard.tabOverview') || 'Overview', icon: LayoutDashboard },
        { id: 'chat', label: t('dashboard.tabChat') || 'AI Assistant', icon: Bot },
      ]
    },
    {
      label: t('dashboard.navSectionTools') || 'Farming Intelligence',
      items: [
        { id: 'crop', label: t('dashboard.tabCrop') || 'Crop Advisory', icon: Sprout },
        { id: 'leaf', label: t('dashboard.tabLeaf') || 'Leaf Health', icon: ShieldAlert },
        { id: 'weather', label: t('dashboard.tabWeather') || 'Weather Intelligence', icon: CloudSun },
        { id: 'voice', label: t('dashboard.tabVoice') || 'Voice Assistant', icon: Mic },
      ]
    },
    {
      label: t('dashboard.navSectionMarket') || 'Market Discovery',
      items: [
        { id: 'mandi', label: t('dashboard.tabMandi') || 'Market Intelligence', icon: TrendingUp },
      ]
    }
  ];

  const handleItemClick = (tabId) => {
    onTabChange(tabId);
    if (mobileOpen && onCloseMobile) {
      onCloseMobile();
    }
  };

  const sidebarWidth = collapsed ? '74px' : '260px';

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 35, 23, 0.45)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            zIndex: 998,
            transition: 'opacity 0.25s ease'
          }}
        />
      )}

      {/* Sidebar Aside Container */}
      <aside
        id="agriai-dashboard-sidebar"
        aria-label="AgriAI Sidebar"
        style={{
          width: sidebarWidth,
          minWidth: sidebarWidth,
          maxWidth: sidebarWidth,
          background: '#FFFFFF',
          borderRight: '1px solid #E3E8E3',
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          position: 'sticky',
          top: 0,
          zIndex: 999,
          transition: 'width 0.25s cubic-bezier(0.2, 0, 0, 1), transform 0.25s cubic-bezier(0.2, 0, 0, 1)',
          boxShadow: '1px 0 8px rgba(29, 43, 36, 0.03)',
          overflow: 'hidden'
        }}
        className={`agri-sidebar ${mobileOpen ? 'mobile-open' : ''} ${collapsed ? 'is-collapsed' : ''}`}
      >
        <style>{`
          @media (max-width: 1024px) {
            #agriai-dashboard-sidebar {
              position: fixed !important;
              top: 0 !important;
              bottom: 0 !important;
              left: 0 !important;
              height: 100vh !important;
              transform: translateX(-100%);
              width: 270px !important;
              min-width: 270px !important;
              z-index: 999 !important;
            }
            #agriai-dashboard-sidebar.mobile-open {
              transform: translateX(0) !important;
            }
          }
          .nav-item-btn {
            display: flex;
            align-items: center;
            width: 100%;
            padding: 0.62rem 0.85rem;
            border-radius: 12px;
            border: 1px solid transparent;
            background: transparent;
            color: #475569;
            font-size: 0.88rem;
            font-weight: 500;
            cursor: pointer;
            text-align: left;
            transition: all 0.16s ease-in-out;
            user-select: none;
            gap: 0.75rem;
            white-space: nowrap;
          }
          .nav-item-btn:hover {
            background: #F4F7F4;
            color: #1D2B24;
            border-color: #E6ECE6;
          }
          .nav-item-btn.is-active {
            background: #EBF3E8;
            color: #245C45;
            font-weight: 700;
            border-color: #CBE0C4;
            box-shadow: 0 1px 3px rgba(36, 92, 69, 0.08);
          }
          .nav-item-btn.is-active svg {
            color: #245C45;
          }
        `}</style>

        {/* 1. Sidebar Brand Header */}
        <div
          style={{
            height: '66px',
            padding: collapsed ? '0 0.85rem' : '0 1.25rem',
            borderBottom: '1px solid #E8ECE8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
            <img
              src={assetPath("/images/agriai-leaf-icon.png")}
              alt="AgriAI"
              style={{
                width: '32px',
                height: '32px',
                objectFit: 'contain',
                flexShrink: 0
              }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            {!collapsed && (
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#245C45', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                    AgriAI
                  </span>
                  <span style={{ background: '#E2F0DC', color: '#2F8061', fontSize: '0.65rem', fontWeight: 800, padding: '0.15rem 0.4rem', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    SaaS
                  </span>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#718078', fontWeight: 500, lineHeight: 1 }}>
                  {t('dashboard.brandSubtitle') || 'Enterprise Farming'}
                </div>
              </div>
            )}
          </div>

          {/* Mobile close button */}
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close sidebar"
            className="mobile-only-btn"
            style={{
              display: 'none',
              background: '#F4F7F4',
              border: '1px solid #D5DDD5',
              borderRadius: '8px',
              color: '#475569',
              cursor: 'pointer',
              width: '36px',
              height: '36px',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* 2. Navigation Items List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: collapsed ? '1rem 0.45rem' : '1.1rem 0.85rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            scrollbarWidth: 'thin'
          }}
        >
          {navSections.map((section, sIdx) => (
            <div key={sIdx}>
              {!collapsed && (
                <div
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: '#8A9990',
                    padding: '0 0.5rem 0.45rem',
                    userSelect: 'none'
                  }}
                >
                  {section.label}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      title={collapsed ? item.label : undefined}
                      onClick={() => handleItemClick(item.id)}
                      className={`nav-item-btn ${isActive ? 'is-active' : ''}`}
                      style={{
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        padding: collapsed ? '0.65rem 0' : '0.62rem 0.85rem'
                      }}
                    >
                      <Icon
                        size={19}
                        style={{
                          flexShrink: 0,
                          color: isActive ? '#245C45' : '#64748b'
                        }}
                      />
                      {!collapsed && (
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.label}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* 3. Bottom Offline Status Badge & User Snapshot */}
        <div
          style={{
            borderTop: '1px solid #E8ECE8',
            padding: collapsed ? '0.75rem 0.45rem' : '0.9rem 1rem',
            background: '#FAFBF9',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem',
            flexShrink: 0
          }}
        >
          {!collapsed && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: '#EAF4E7',
                border: '1px solid #CDE2C7',
                padding: '0.4rem 0.65rem',
                borderRadius: '8px',
                fontSize: '0.74rem',
                color: '#245C45',
                fontWeight: 600
              }}
            >
              <ShieldCheck size={14} style={{ color: '#2F8061', flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {t('dashboard.localAiBadge') || 'Local AI Active • 100% Private'}
              </span>
            </div>
          )}

          {/* User Row & Collapse Toggle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'space-between',
              gap: '0.5rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '999px',
                  background: avatar.bg,
                  border: `1.5px solid ${avatar.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.05rem',
                  flexShrink: 0
                }}
              >
                {avatar.emoji}
              </div>
              {!collapsed && (
                <div style={{ minWidth: 0, overflow: 'hidden' }}>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1D2B24', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {user?.name || 'Ramesh'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#718078', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {avatar.title || 'Cultivator'}
                  </div>
                </div>
              )}
            </div>

            {/* Desktop Collapse / Expand Toggle Button */}
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label={collapsed ? (t('dashboard.expandSidebar') || 'Expand sidebar') : (t('dashboard.collapseSidebar') || 'Collapse sidebar')}
              title={collapsed ? (t('dashboard.expandSidebar') || 'Expand sidebar') : (t('dashboard.collapseSidebar') || 'Collapse sidebar')}
              className="desktop-only-collapse"
              style={{
                background: '#FFFFFF',
                border: '1px solid #D5DDD5',
                color: '#475569',
                borderRadius: '8px',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.16s ease',
                flexShrink: 0
              }}
            >
              {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
