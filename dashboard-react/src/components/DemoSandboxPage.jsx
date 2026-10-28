import { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  ShoppingBag,
  CreditCard,
  User,
  Users,
  Send,
  Zap,
  CheckCircle2,
  ExternalLink,
  ArrowLeft,
  Eye,
  MousePointerClick,
  Sliders,
  Play,
  Square,
  Flame,
  Check,
  Building,
  Rocket
} from 'lucide-react';
import './DemoSandboxPage.css';

const USERS = [
  { id: 'usr_alex_dev', name: 'Alex Rivera', role: 'DevOps Lead', email: 'alex.rivera@acme.corp' },
  { id: 'usr_sarah_pm', name: 'Sarah Chen', role: 'Product VP', email: 'sarah.chen@growth.io' },
  { id: 'usr_marcus_cto', name: 'Marcus Vance', role: 'Chief Architect', email: 'marcus@cloudscale.net' },
  { id: 'usr_guest_demo', name: 'Demo Visitor', role: 'Prospect', email: 'guest.demo@visitor.org' }
];

const PAGES = [
  { path: '/home', label: 'Home Dashboard' },
  { path: '/features/telemetry', label: 'Telemetry Features' },
  { path: '/pricing', label: 'Pricing Plans' },
  { path: '/docs/api-reference', label: 'API Reference' },
  { path: '/checkout/annual-pro', label: 'Checkout Page' }
];

export default function DemoSandboxPage({ onSendEvent, onSurge, onNavigateDashboard }) {
  const [currentUser, setCurrentUser] = useState(USERS[0]);
  const [annualBilling, setAnnualBilling] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [outgoingLogs, setOutgoingLogs] = useState([]);
  const [autoRate, setAutoRate] = useState(0); // 0 = off, 1 = 1/s, 3 = 3/s
  const [purchasedPlan, setPurchasedPlan] = useState(null);
  const autoIntervalRef = useRef(null);

  const addLog = (eventType, payload) => {
    const logItem = {
      id: Math.random().toString(36).slice(2, 9),
      time: new Date().toLocaleTimeString(),
      event: eventType,
      payload,
      status: 202
    };
    setOutgoingLogs(prev => [logItem, ...prev].slice(0, 15));
  };

  const handleAction = async (type, props) => {
    await onSendEvent(type, {
      ...props,
      user_name: currentUser.name,
      user_email: currentUser.email,
      source: 'demo_sandbox_app'
    }, currentUser.id);
    addLog(type, props);
  };

  const handlePurchase = async (planName, price) => {
    setPurchasedPlan(planName);
    const amount = annualBilling ? price * 10 : price;
    await handleAction('purchase', {
      item: `TaskGo ${planName}`,
      amount,
      currency: 'USD',
      billing_cycle: annualBilling ? 'annual' : 'monthly'
    });
    setTimeout(() => setPurchasedPlan(null), 2500);
  };

  const handlePageView = async (page) => {
    await handleAction('page_view', {
      path: page.path,
      page_title: page.label,
      referrer: 'https://taskgo.io/app'
    });
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;
    await handleAction('button_click', {
      action: 'invite_team_member',
      invited_email: inviteEmail
    });
    setInviteEmail('');
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!signupEmail) return;
    await handleAction('signup', {
      signup_email: signupEmail,
      referral: 'sandbox_hero_cta',
      tier: 'trial_enterprise'
    });
    setSignupEmail('');
  };

  // Background traffic generator
  useEffect(() => {
    if (autoRate > 0) {
      const ms = 1000 / autoRate;
      autoIntervalRef.current = setInterval(() => {
        const randomUser = USERS[Math.floor(Math.random() * USERS.length)];
        const types = ['page_view', 'button_click', 'signup', 'purchase'];
        const chosen = types[Math.floor(Math.random() * types.length)];
        let p = {};
        if (chosen === 'page_view') {
          p = { path: PAGES[Math.floor(Math.random() * PAGES.length)].path };
        } else if (chosen === 'button_click') {
          p = { button_id: 'btn-auto-' + Math.floor(Math.random() * 5) };
        } else if (chosen === 'purchase') {
          p = { item: 'TaskGo Pro Tier', amount: 79, currency: 'USD' };
        } else {
          p = { signup_source: 'auto_traffic_stream' };
        }
        onSendEvent(chosen, { ...p, source: 'auto_generator' }, randomUser.id);
        addLog(chosen, p);
      }, ms);
    } else {
      if (autoIntervalRef.current) clearInterval(autoIntervalRef.current);
    }
    return () => {
      if (autoIntervalRef.current) clearInterval(autoIntervalRef.current);
    };
  }, [autoRate, onSendEvent]);

  return (
    <div className="sandbox-page animate-fade-in">
      {/* Top Navigation & Status Bar */}
      <div className="sandbox-top-bar">
        <div className="sandbox-top-left">
          <button className="back-dash-btn" onClick={onNavigateDashboard}>
            <ArrowLeft size={14} />
            <span>Return to Dashboard</span>
          </button>
          <div className="sandbox-breadcrumb">
            <span className="sandbox-dot" />
            <span className="sandbox-status-text">Interactive Demo Client Application</span>
          </div>
        </div>

        <div className="sandbox-user-selector">
          <span className="user-sel-label">Active User Persona:</span>
          <div className="user-pills">
            {USERS.map((u) => (
              <button
                key={u.id}
                className={`user-pill ${currentUser.id === u.id ? 'active' : ''}`}
                onClick={() => setCurrentUser(u)}
              >
                <User size={12} />
                <span>{u.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Hero Explanatory Banner */}
      <div className="sandbox-hero">
        <div className="sandbox-badge">
          <Sparkles size={14} />
          <span>Real-World Client Simulator</span>
        </div>
        <h2 className="sandbox-title">TaskGo Enterprise Experience Sandbox</h2>
        <p className="sandbox-desc">
          Interact with this mock web application below. Every button click, page change, plan purchase, and lead submission instantly triggers telemetry ingestion packets to your <strong>Eventix Gateway</strong> via <code>POST /api/events/ingest</code>.
        </p>
      </div>

      {/* Main Grid: Mock App on Left (2 cols), Live Telemetry HUD on Right (1 col) */}
      <div className="sandbox-layout-grid">
        {/* Left Column: Interactive App */}
        <div className="mock-app-container">
          {/* Module 1: Page Navigation */}
          <div className="mock-card">
            <div className="mock-card-header">
              <div className="mock-icon-wrap bg-sky">
                <Eye size={16} />
              </div>
              <div>
                <h4 className="mock-card-title">1. Browse Pages (Simulate Pageviews)</h4>
                <p className="mock-card-sub">Click any route to fire a <code>page_view</code> event to Redis Streams</p>
              </div>
            </div>
            <div className="route-pills">
              {PAGES.map((page) => (
                <button
                  key={page.path}
                  className="route-pill-btn"
                  onClick={() => handlePageView(page)}
                >
                  <Eye size={12} />
                  <span>{page.label}</span>
                  <span className="route-tag font-mono">{page.path}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Module 2: Interactive Pricing & Checkout */}
          <div className="mock-card">
            <div className="mock-card-header">
              <div className="mock-icon-wrap bg-indigo">
                <CreditCard size={16} />
              </div>
              <div>
                <h4 className="mock-card-title">2. SaaS Subscription & Checkout</h4>
                <p className="mock-card-sub">Selecting a plan triggers a high-value <code>purchase</code> event</p>
              </div>
              <div className="billing-toggle-wrap">
                <span className={!annualBilling ? 'active-text' : ''}>Monthly</span>
                <button
                  className={`toggle-switch ${annualBilling ? 'on' : ''}`}
                  onClick={() => {
                    const next = !annualBilling;
                    setAnnualBilling(next);
                    handleAction('button_click', { button: 'toggle_billing', billing: next ? 'annual' : 'monthly' });
                  }}
                >
                  <span className="toggle-thumb" />
                </button>
                <span className={annualBilling ? 'active-text' : ''}>
                  Annual <span className="discount-tag">-20%</span>
                </span>
              </div>
            </div>

            <div className="plans-grid">
              {/* Starter */}
              <div className="plan-card">
                <div className="plan-tier">Starter</div>
                <div className="plan-price">
                  ${annualBilling ? 290 : 29}
                  <span className="plan-period">/{annualBilling ? 'yr' : 'mo'}</span>
                </div>
                <p className="plan-desc">For small startup teams testing real-time workflows.</p>
                <button
                  className="plan-btn"
                  onClick={() => handlePurchase('Starter Tier', 29)}
                >
                  {purchasedPlan === 'Starter Tier' ? (
                    <span className="text-success flex-center"><Check size={14} /> Purchased!</span>
                  ) : (
                    'Select Starter'
                  )}
                </button>
              </div>

              {/* Pro */}
              <div className="plan-card popular">
                <div className="popular-badge">Most Popular</div>
                <div className="plan-tier">Pro Growth</div>
                <div className="plan-price">
                  ${annualBilling ? 790 : 79}
                  <span className="plan-period">/{annualBilling ? 'yr' : 'mo'}</span>
                </div>
                <p className="plan-desc">High-velocity streaming for rapidly scaling apps.</p>
                <button
                  className="plan-btn popular-btn"
                  onClick={() => handlePurchase('Pro Growth', 79)}
                >
                  {purchasedPlan === 'Pro Growth' ? (
                    <span className="text-white flex-center"><Check size={14} /> Purchased!</span>
                  ) : (
                    'Upgrade to Pro'
                  )}
                </button>
              </div>

              {/* Enterprise */}
              <div className="plan-card">
                <div className="plan-tier">Enterprise</div>
                <div className="plan-price">
                  ${annualBilling ? 1990 : 199}
                  <span className="plan-period">/{annualBilling ? 'yr' : 'mo'}</span>
                </div>
                <p className="plan-desc">Dedicated worker clusters with WiredTiger retention.</p>
                <button
                  className="plan-btn"
                  onClick={() => handlePurchase('Enterprise Scale', 199)}
                >
                  {purchasedPlan === 'Enterprise Scale' ? (
                    <span className="text-success flex-center"><Check size={14} /> Purchased!</span>
                  ) : (
                    'Buy Enterprise'
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Module 3: Workspace Interactions & Actions */}
          <div className="mock-card">
            <div className="mock-card-header">
              <div className="mock-icon-wrap bg-emerald">
                <MousePointerClick size={16} />
              </div>
              <div>
                <h4 className="mock-card-title">3. User Actions & Engagement</h4>
                <p className="mock-card-sub">Interact with app controls to generate rich action properties</p>
              </div>
            </div>

            <div className="actions-two-col">
              {/* Invite Team Member */}
              <form className="action-subcard" onSubmit={handleInvite}>
                <span className="subcard-title">Invite Team Member</span>
                <p className="subcard-sub">Sends invite event with email attribute</p>
                <div className="subcard-input-row">
                  <input
                    type="email"
                    placeholder="colleague@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="sandbox-input"
                  />
                  <button type="submit" className="subcard-btn">
                    <Send size={12} />
                    <span>Invite</span>
                  </button>
                </div>
              </form>

              {/* Enterprise Beta Signup */}
              <form className="action-subcard" onSubmit={handleSignup}>
                <span className="subcard-title">Request Early Beta Access</span>
                <p className="subcard-sub">Fires a high-priority <code>signup</code> event</p>
                <div className="subcard-input-row">
                  <input
                    type="email"
                    placeholder="lead@enterprise.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    className="sandbox-input"
                  />
                  <button type="submit" className="subcard-btn primary">
                    <Rocket size={12} />
                    <span>Sign Up</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Quick action buttons */}
            <div className="quick-actions-bar">
              <span className="quick-label">Quick Actions:</span>
              <button
                className="quick-action-pill"
                onClick={() => handleAction('button_click', { feature: 'deploy_microservice', env: 'production' })}
              >
                🚀 Deploy Service
              </button>
              <button
                className="quick-action-pill"
                onClick={() => handleAction('button_click', { feature: 'export_audit_logs', format: 'csv' })}
              >
                📥 Export Audit Logs
              </button>
              <button
                className="quick-action-pill"
                onClick={() => handleAction('button_click', { feature: 'toggle_dark_mode', mode: 'system' })}
              >
                🎨 Theme Changed
              </button>
              <button
                className="quick-action-pill burst-pill"
                onClick={() => onSurge()}
              >
                <Flame size={12} />
                <span>Simulate Surge (20x)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Outgoing Telemetry HUD */}
        <div className="hud-container">
          {/* Automated Traffic Generator Card */}
          <div className="hud-card">
            <div className="hud-card-header">
              <div className="hud-icon-wrap bg-amber">
                <Sliders size={16} />
              </div>
              <div>
                <h4 className="hud-title">Automated Traffic Generator</h4>
                <p className="hud-sub">Continuously fires telemetry events</p>
              </div>
            </div>

            <div className="traffic-rate-selector">
              {[0, 1, 3, 5].map((rate) => (
                <button
                  key={rate}
                  className={`traffic-rate-btn ${autoRate === rate ? 'active' : ''}`}
                  onClick={() => setAutoRate(rate)}
                >
                  {rate === 0 ? 'Off' : `${rate} ev/s`}
                </button>
              ))}
            </div>

            {autoRate > 0 && (
              <div className="generator-active-badge">
                <span className="live-ping" />
                <span>Simulating continuous stream at {autoRate} events/second...</span>
              </div>
            )}
          </div>

          {/* Live Outgoing Stream Feed */}
          <div className="hud-card flex-1">
            <div className="hud-card-header">
              <div className="hud-icon-wrap bg-indigo">
                <Zap size={16} />
              </div>
              <div className="flex-1">
                <div className="hud-title-row">
                  <h4 className="hud-title">Live Emitted Stream</h4>
                  <span className="hud-count-badge font-mono">{outgoingLogs.length} recent</span>
                </div>
                <p className="hud-sub">Packets dispatched to <code>/api/events/ingest</code></p>
              </div>
            </div>

            <div className="outgoing-logs-list">
              {outgoingLogs.length === 0 ? (
                <div className="logs-empty">
                  <span>No events emitted yet. Click any button or plan on the left!</span>
                </div>
              ) : (
                outgoingLogs.map((log) => (
                  <div key={log.id} className="log-row animate-fade-in">
                    <div className="log-row-top">
                      <span className={`log-event-tag tag-${log.event}`}>{log.event}</span>
                      <span className="log-status">202 Accepted</span>
                      <span className="log-time font-mono">{log.time}</span>
                    </div>
                    <div className="log-payload font-mono">
                      {JSON.stringify(log.payload)}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="hud-footer">
              <button className="jump-dashboard-btn" onClick={onNavigateDashboard}>
                <span>View Real-Time Counters in Dashboard</span>
                <ExternalLink size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
