import { useEffect, useRef } from 'react';
import { TrendingUp, Users, Calendar, HeartPulse } from 'lucide-react';
import './MetricsGrid.css';

function useAnimatedNumber(value) {
  const ref = useRef(null);
  const prevValue = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const start = prevValue.current;
    const end = value;
    const duration = 600;
    const startTime = performance.now();

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * eased);
      el.textContent = current.toLocaleString();

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        prevValue.current = end;
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  return ref;
}

const metrics = [
  {
    key: 'total_events',
    title: 'Total Ingested Events',
    icon: TrendingUp,
    color: 'var(--accent)',
    tag: 'Redis O(1)',
    tagType: 'accent',
    sub: 'Persisted in MongoDB & stream buffered'
  },
  {
    key: 'unique_users',
    title: 'Unique Users',
    icon: Users,
    color: 'var(--info)',
    tag: 'HyperLogLog',
    tagType: 'info',
    sub: '12KB fixed memory footprint in Redis'
  },
  {
    key: 'events_today',
    title: 'Events Today',
    icon: Calendar,
    color: 'var(--success)',
    tag: 'Live',
    tagType: 'success',
    sub: 'UTC sliding 24-hour collection'
  },
  {
    key: 'health',
    title: 'Ingestion Health',
    icon: HeartPulse,
    color: 'var(--success)',
    tag: '100% SLA',
    tagType: 'success',
    sub: 'Zero dropped packets · 1000 req/s limit'
  }
];

function MetricCard({ metric, value }) {
  const numRef = useAnimatedNumber(value);
  const isHealth = metric.key === 'health';

  return (
    <div className="metric-card" style={{ '--card-accent': metric.color }}>
      <div className="metric-header">
        <div className="metric-icon-wrap" style={{ color: metric.color }}>
          <metric.icon size={16} />
        </div>
        <span className={`metric-tag metric-tag-${metric.tagType}`}>{metric.tag}</span>
      </div>
      <div className="metric-title">{metric.title}</div>
      {isHealth ? (
        <div className="metric-value health-value">202 Accepted</div>
      ) : (
        <div className="metric-value" ref={numRef}>0</div>
      )}
      <div className="metric-sub">{metric.sub}</div>
    </div>
  );
}

function MetricsGrid({ stats }) {
  return (
    <div className="metrics-grid">
      {metrics.map((m, i) => (
        <MetricCard
          key={m.key}
          metric={m}
          value={m.key === 'health' ? 0 : (stats[m.key] || 0)}
        />
      ))}
    </div>
  );
}

export default MetricsGrid;
