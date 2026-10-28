import { useState } from 'react';
import { Activity, Bell, Copy, Check, Sparkles, LayoutDashboard, PlayCircle } from 'lucide-react';
import './Navbar.css';

function Navbar({ isConnected, isAuthenticated, apiKey, alerts = [], activeTab = 'dashboard', onSelectTab }) {
  const [copied, setCopied] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);

  const copyApiKey = () => {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTabClick = (tabKey, anchorId = null) => {
    if (tabKey === 'demo') {
      onSelectTab('demo');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      onSelectTab('dashboard');
      if (anchorId) {
        setTimeout(() => {
          const el = document.getElementById(anchorId);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  return (
    <header className="navbar-wrapper">
      <div className="navbar-pill">
        <div className="navbar-left">
          <div className="brand" onClick={() => handleTabClick('dashboard')} style={{ cursor: 'pointer' }}>
            <div className="brand-logo">
              <Activity size={18} strokeWidth={2.5} />
            </div>
            <span className="brand-name">
              Event<span className="brand-highlight">ix</span>
            </span>
          </div>
        </div>

        <nav className="navbar-center">
          <button
            className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleTabClick('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={`nav-tab ${activeTab === 'demo' ? 'active' : ''}`}
            onClick={() => handleTabClick('demo')}
          >
            <span className="demo-pill-badge">Demo App</span>
          </button>
          <button
            className="nav-tab"
            onClick={() => handleTabClick('dashboard', 'analytics')}
          >
            Telemetry
          </button>
          <button
            className="nav-tab"
            onClick={() => handleTabClick('dashboard', 'events')}
          >
            Ledger
          </button>
          <button
            className="nav-tab"
            onClick={() => handleTabClick('dashboard', 'pipeline')}
          >
            Pipeline
          </button>
        </nav>

        <div className="navbar-right">
          <div className={`connection-badge ${isConnected ? 'connected' : ''}`}>
            <span className="connection-dot" />
            <span className="connection-text">
              {isConnected ? 'Live Connected' : 'Offline'}
            </span>
          </div>

          {isAuthenticated && apiKey && (
            <button className="api-key-btn" onClick={copyApiKey} title="Copy API Key">
              <span className="api-key-label">Key</span>
              <span className="api-key-value">
                {apiKey.slice(0, 7)}...{apiKey.slice(-4)}
              </span>
              {copied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
            </button>
          )}

          <div className="alerts-wrapper">
            <button
              className={`icon-btn ${alerts.length > 0 ? 'has-alerts' : ''}`}
              onClick={() => setShowAlerts(!showAlerts)}
              title="Spike Alerts"
            >
              <Bell size={16} />
              {alerts.length > 0 && <span className="alert-count">{alerts.length}</span>}
            </button>

            {showAlerts && alerts.length > 0 && (
              <div className="alerts-dropdown">
                <div className="alerts-header">
                  <span>Spike Alerts</span>
                  <span className="alerts-count">{alerts.length}</span>
                </div>
                {alerts.map((alert, i) => (
                  <div key={i} className="alert-item">
                    <span className="alert-icon">⚡</span>
                    <div className="alert-content">
                      <span className="alert-msg">{alert.message || 'Spike detected'}</span>
                      <span className="alert-time">
                        {new Date(alert.timestamp || Date.now()).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            className="nav-cta-btn"
            onClick={() => onSelectTab(activeTab === 'demo' ? 'dashboard' : 'demo')}
          >
            {activeTab === 'demo' ? (
              <>
                <LayoutDashboard size={13} />
                <span>Open Dashboard</span>
              </>
            ) : (
              <>
                <PlayCircle size={13} />
                <span>Demo Sandbox</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
