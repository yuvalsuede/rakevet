import React, { useState, useEffect } from 'react';
import RoutePlanner from './components/RoutePlanner';
import LineMap from './components/LineMap';
import StationSchedule from './components/StationSchedule';
import LineReference from './components/LineReference';
import TermsPopup from './components/TermsPopup';
import { SearchIcon, MapIcon, ClockIcon, TrainIcon, AlertIcon } from './components/Icons';

const BLUE = '#0B3D91';
const BLUE_LIGHT = '#1565C0';
const BLUE_DARK = '#062555';
const GRAY = '#F5F5F5';
const GRAY_MED = '#9E9E9E';
const WHITE = '#FFFFFF';

const TERMS_KEY = 'rakevet_terms_accepted';

// Tab button component
function TabBtn({ active, label, icon, onClick }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: '12px 8px',
      background: active ? WHITE : 'transparent',
      color: active ? BLUE : WHITE + 'CC',
      border: 'none', borderRadius: active ? '12px 12px 0 0' : 0,
      fontSize: 13, fontWeight: active ? 700 : 500,
      cursor: 'pointer', transition: 'all 0.2s',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
      boxShadow: active ? '0 -2px 8px rgba(0,0,0,0.08)' : 'none',
      fontFamily: 'inherit',
    }}>
      <span style={{ display: 'flex' }}>{icon}</span>
      {label}
    </button>
  );
}

// Service alert banner
function AlertBanner({ messages }) {
  if (!messages || messages.length === 0) return null;
  return (
    <div style={{
      margin: '0 16px', padding: '10px 14px', background: '#FFF3E0', borderRadius: 10,
      display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#E65100',
    }}>
      <AlertIcon size={16} color="#E65100" style={{ marginTop: 2, flexShrink: 0 }} />
      <div>
        {messages.map((msg, i) => (
          <div key={i}><strong>הודעת שירות:</strong> {msg}</div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState(0);
  const [initialStation, setInitialStation] = useState(null);
  const [termsAccepted, setTermsAccepted] = useState(() => {
    try {
      return localStorage.getItem(TERMS_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const handleAcceptTerms = () => {
    setTermsAccepted(true);
    try {
      localStorage.setItem(TERMS_KEY, 'true');
    } catch {
      // localStorage not available — that's fine
    }
  };

  const handleShowTerms = () => {
    setTermsAccepted(false);
    try {
      localStorage.removeItem(TERMS_KEY);
    } catch {}
  };

  const tabs = [
    { label: 'תכנון נסיעה', icon: <SearchIcon size={18} color="currentColor" /> },
    { label: 'מפת קווים', icon: <MapIcon size={18} color="currentColor" /> },
    { label: 'לוח זמנים', icon: <ClockIcon size={18} color="currentColor" /> },
    { label: 'קווי רכבת', icon: <TrainIcon size={18} color="currentColor" /> },
  ];

  const MAX_W = 640;

  return (
    <div dir="rtl" style={{
      width: '100%', minHeight: '100vh',
      background: GRAY, fontFamily: "'Segoe UI', 'Arial', sans-serif",
    }}>
      {/* Terms popup */}
      {!termsAccepted && <TermsPopup onAccept={handleAcceptTerms} />}

      {/* Header — full-width background, centered content */}
      <div style={{ background: `linear-gradient(135deg, ${BLUE_DARK}, ${BLUE})`, padding: '20px 20px 0' }}>
        <div style={{ maxWidth: MAX_W, margin: '0 auto' }}>
          <div style={{ paddingBottom: 16, textAlign: 'center' }}>
            <h1 style={{
              margin: 0, fontSize: 32, fontWeight: 900, color: WHITE,
              letterSpacing: -1, fontFamily: "'Arial', sans-serif",
            }}>
              רקבת
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: WHITE + '99' }}>
              מתכנן נסיעות חכם לרכבת ישראל
            </p>
          </div>

          <div style={{ display: 'flex', gap: 2 }}>
            {tabs.map((tab, i) => (
              <TabBtn
                key={i}
                active={activeTab === i}
                label={tab.label}
                icon={tab.icon}
                onClick={() => setActiveTab(i)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Content — centered with max-width */}
      <div style={{ maxWidth: MAX_W, margin: '0 auto', paddingTop: 12 }}>
        {activeTab === 0 && <RoutePlanner initialStation={initialStation} onStationConsumed={() => setInitialStation(null)} />}
        {activeTab === 1 && (
          <LineMap
            onNavigateToSearch={(stationId) => { setInitialStation(stationId); setActiveTab(0); }}
            onNavigateToSchedule={(stationId) => { setInitialStation(stationId); setActiveTab(2); }}
          />
        )}
        {activeTab === 2 && <StationSchedule initialStation={initialStation} onStationConsumed={() => setInitialStation(null)} />}
        {activeTab === 3 && <LineReference />}
      </div>

      {/* Footer */}
      <div style={{ maxWidth: MAX_W, margin: '0 auto', padding: '20px 16px', textAlign: 'center', fontSize: 12, color: GRAY_MED }}>
        <p style={{ margin: '0 0 4px' }}>רקבת — מתכנן נסיעות קוד פתוח לרכבת ישראל</p>
        <p style={{ margin: '0 0 4px' }}>נתונים מתעדכנים ישירות מרכבת ישראל · ללא פרסומות · חינם</p>
        <p style={{ margin: '8px 0 0' }}>
          <span
            onClick={handleShowTerms}
            style={{ color: BLUE_LIGHT, cursor: 'pointer', textDecoration: 'underline' }}
          >
            תנאי שימוש ופרטיות
          </span>
        </p>
      </div>
    </div>
  );
}
