import { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Activity, PieChart as PieIcon, RefreshCw, Zap } from 'lucide-react';
import './ChartsSection.css';

const EVENT_COLORS = {
  page_view: '#4f46e5',    // Indigo
  signup: '#10b981',       // Emerald
  purchase: '#f59e0b',     // Amber
  button_click: '#0ea5e9'  // Sky
};

const EVENT_LABELS = {
  page_view: 'Page Views',
  signup: 'Signups',
  purchase: 'Purchases',
  button_click: 'Interactions'
};

function CustomAreaTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <div className="tooltip-header">{label}</div>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="tooltip-row">
            <span className="tooltip-dot" style={{ backgroundColor: entry.color }} />
            <span className="tooltip-name">{entry.name}:</span>
            <span className="tooltip-val">{Number(entry.value).toLocaleString()}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export default function ChartsSection({ liveData = [], byType = {} }) {
  const [activeWindow, setActiveWindow] = useState('realtime');

  // Format donut data
  const pieData = Object.entries(byType).map(([key, val]) => ({
    name: EVENT_LABELS[key] || key,
    rawKey: key,
    value: val || 0,
    color: EVENT_COLORS[key] || '#94a3b8'
  })).filter(d => d.value > 0);

  const totalTypeEvents = Object.values(byType).reduce((a, b) => a + (b || 0), 0);

  // Compute live throughput approximation
  const latestEvents = liveData.length > 1
    ? Math.max(0, (liveData[liveData.length - 1]?.total || 0) - (liveData[liveData.length - 2]?.total || 0))
    : 0;

  return (
    <section className="charts-grid" id="analytics">
      {/* Real-time Ingestion Stream Chart */}
      <div className="chart-card area-card">
        <div className="chart-card-header">
          <div className="chart-title-group">
            <div className="chart-icon-box">
              <Activity size={18} />
            </div>
            <div>
              <h3 className="chart-title">Real-Time Ingestion Velocity</h3>
              <p className="chart-subtitle">Event streaming pipeline throughput & cumulative volume</p>
            </div>
          </div>
          <div className="chart-controls">
            <div className="live-pill">
              <span className="live-ping" />
              <span>{latestEvents} ev/tick</span>
            </div>
            <div className="window-selector">
              <button
                className={`window-btn ${activeWindow === 'realtime' ? 'active' : ''}`}
                onClick={() => setActiveWindow('realtime')}
              >
                Realtime
              </button>
              <button
                className={`window-btn ${activeWindow === '5m' ? 'active' : ''}`}
                onClick={() => setActiveWindow('5m')}
              >
                Last 30 ticks
              </button>
            </div>
          </div>
        </div>

        <div className="chart-body">
          {liveData.length === 0 ? (
            <div className="chart-empty">
              <RefreshCw size={24} className="spin-icon" />
              <span>Awaiting telemetry stream...</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={liveData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="todayGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="time"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}
                />
                <Tooltip content={<CustomAreaTooltip />} />
                <Area
                  type="monotone"
                  dataKey="total"
                  name="Total Events"
                  stroke="#4f46e5"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#totalGradient)"
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="today"
                  name="Events Today"
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fillOpacity={1}
                  fill="url(#todayGradient)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="chart-footer-metrics">
          <div className="sub-metric">
            <span className="sub-metric-label">Ingestion Mode</span>
            <span className="sub-metric-val">Batch Micro-Pipelines</span>
          </div>
          <div className="sub-metric">
            <span className="sub-metric-label">Buffer Capacity</span>
            <span className="sub-metric-val text-success">Optimal (&lt; 2ms)</span>
          </div>
          <div className="sub-metric">
            <span className="sub-metric-label">Stream Protocol</span>
            <span className="sub-metric-val">HTTP REST + WSS</span>
          </div>
        </div>
      </div>

      {/* Event Category Breakdown */}
      <div className="chart-card donut-card">
        <div className="chart-card-header">
          <div className="chart-title-group">
            <div className="chart-icon-box">
              <PieIcon size={18} />
            </div>
            <div>
              <h3 className="chart-title">Event Breakdown</h3>
              <p className="chart-subtitle">Distribution by event taxonomy</p>
            </div>
          </div>
        </div>

        <div className="donut-body">
          {pieData.length === 0 ? (
            <div className="chart-empty">
              <span>No classified events recorded</span>
            </div>
          ) : (
            <div className="donut-container">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={54}
                    outerRadius={76}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val, name) => [`${val} events (${totalTypeEvents > 0 ? ((val / totalTypeEvents) * 100).toFixed(1) : 0}%)`, name]}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: 12,
                      fontSize: 12,
                      color: '#0f172a',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.08)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="donut-center-badge">
                <span className="donut-count">{totalTypeEvents.toLocaleString()}</span>
                <span className="donut-label">Total</span>
              </div>
            </div>
          )}

          <div className="breakdown-list">
            {Object.entries(EVENT_LABELS).map(([k, label]) => {
              const count = byType[k] || 0;
              const pct = totalTypeEvents > 0 ? ((count / totalTypeEvents) * 100).toFixed(1) : '0.0';
              const color = EVENT_COLORS[k];
              return (
                <div key={k} className="breakdown-item">
                  <div className="breakdown-left">
                    <span className="breakdown-dot" style={{ backgroundColor: color }} />
                    <span className="breakdown-name">{label}</span>
                  </div>
                  <div className="breakdown-right">
                    <span className="breakdown-count">{count.toLocaleString()}</span>
                    <span className="breakdown-pct">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
