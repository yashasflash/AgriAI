import React, { useState, useEffect } from 'react';
import { LanguageProvider } from './i18n';
import LandingNavbar from './components/LandingNavbar';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import { getStoredUser, getStoredToken, getProfile, logoutUser } from './services/api';

export default function App() {
  const [user, setUser] = useState(() => getStoredUser());
  const [activeStage, setActiveStage] = useState(() => {
    const storedUser = getStoredUser();
    const storedToken = getStoredToken();
    return storedUser && storedToken ? 'dashboard' : 'landing';
  });
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'crop' | 'leaf'

  // Auto verify session on mount if token exists
  useEffect(() => {
    async function verifySession() {
      const token = getStoredToken();
      if (token) {
        try {
          const profileData = await getProfile();
          if (profileData) {
            setUser(profileData);
          }
        } catch {
          // Token expired or invalid
          setUser(null);
          setActiveStage('landing');
        }
      }
    }
    verifySession();
  }, []);

  const handleNavigate = (stage) => {
    setActiveStage(stage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogin = (userData) => {
    setUser(userData);
    setActiveStage('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    setActiveStage('landing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };



  const handleUserUpdated = (updatedUser) => {
    setUser(updatedUser);
  };

  const isAuthPage = activeStage === 'login' || activeStage === 'register';

  return (
    <LanguageProvider initialLanguage={user?.language || 'en'}>
      <div
        className="agri-app"
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          background: activeStage === 'landing' ? 'var(--bg-page)' : (isAuthPage ? '#0c1c10' : '#f8fafc')
        }}
      >
        {/* ============================================================ */}
        {/* PUBLIC STATE: Landing Page + Landing Navbar ONLY            */}
        {/* ============================================================ */}
        {activeStage === 'landing' && (
          <>
            <LandingNavbar
              onNavigate={handleNavigate}
              onGetStarted={() => handleNavigate('login')}
            />
            <div style={{ flex: 1 }}>
              <LandingPage
                onGetStarted={() => handleNavigate('login')}
                onNavigate={handleNavigate}
              />
            </div>
            <Footer onNavigate={handleNavigate} />
          </>
        )}

        {/* ============================================================ */}
        {/* AUTH FLOW: Login / Register Page (No duplicate navbars)      */}
        {/* ============================================================ */}
        {activeStage === 'login' && (
          <div style={{ flex: 1 }}>
            <LoginPage
              onLogin={handleLogin}
              onNavigate={handleNavigate}
              onBack={() => handleNavigate('landing')}
            />
          </div>
        )}

        {activeStage === 'register' && (
          <div style={{ flex: 1 }}>
            <LoginPage
              initialMode="register"
              onLogin={handleLogin}
              onNavigate={handleNavigate}
              onBack={() => handleNavigate('landing')}
            />
          </div>
        )}

        {/* ============================================================ */}
        {/* AUTHENTICATED STATE: Dashboard + Dashboard Navbar ONLY       */}
        {/* (Landing Navbar & Landing Sections COMPLETELY UNMOUNTED)     */}
        {/* ============================================================ */}
        {activeStage === 'dashboard' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
            <Dashboard
              user={user}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onUserUpdated={handleUserUpdated}
              onLogout={handleLogout}
              onNavigate={handleNavigate}
            />
          </div>
        )}
      </div>
    </LanguageProvider>
  );
}
