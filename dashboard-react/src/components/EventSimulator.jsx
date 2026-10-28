import { useState } from 'react';
import { Zap, Eye, MousePointerClick, UserPlus, CreditCard, Loader2, PlayCircle, ArrowRight } from 'lucide-react';
import './EventSimulator.css';

const eventButtons = [
  { type: 'page_view', label: 'Pageview', icon: Eye, props: { path: '/features', browser: 'Chrome' } },
  { type: 'button_click', label: 'Click CTA', icon: MousePointerClick, props: { button_id: 'btn-upgrade-pro' } },
  { type: 'signup', label: 'Signup', icon: UserPlus, props: { plan: 'enterprise', source: 'pricing' } },
  { type: 'purchase', label: 'Purchase', icon: CreditCard, props: { amount: 149.00, currency: 'USD', item: 'Eventix Pro Annual' } },
];

function EventSimulator({ onSendEvent, onSurge, onOpenDemo }) {
  const [surging, setSurging] = useState(false);
  const [sending, setSending] = useState(null);

  const handleSend = async (type, props) => {
    setSending(type);
    await onSendEvent(type, props);
    setTimeout(() => setSending(null), 400);
  };

  const handleSurge = async () => {
    setSurging(true);
    await onSurge();
    setTimeout(() => setSurging(false), 2000);
  };

  return (
    <div className="simulator animate-slide-up" id="simulator" style={{ animationDelay: '100ms' }}>
      <div className="sim-left">
        <span className="sim-badge">
          <Zap size={12} />
          Event Simulator
        </span>
        <span className="sim-desc">Inject live analytics events into the pipeline</span>
      </div>

      <div className="sim-actions">
        {eventButtons.map(({ type, label, icon: Icon, props }) => (
          <button
            key={type}
            className="sim-btn"
            onClick={() => handleSend(type, props)}
            disabled={sending === type}
          >
            {sending === type ? <Loader2 size={13} className="spin" /> : <Icon size={13} />}
            <span>{label}</span>
          </button>
        ))}

        <button
          className="sim-btn sim-btn-surge"
          onClick={handleSurge}
          disabled={surging}
        >
          {surging ? <Loader2 size={13} className="spin" /> : <Zap size={13} />}
          <span>{surging ? 'Sending...' : 'Surge ×20'}</span>
        </button>

        {onOpenDemo && (
          <button className="sim-btn sim-btn-demo-link" onClick={onOpenDemo}>
            <PlayCircle size={13} />
            <span>Launch Full Demo Sandbox</span>
            <ArrowRight size={11} />
          </button>
        )}
      </div>
    </div>
  );
}

export default EventSimulator;
