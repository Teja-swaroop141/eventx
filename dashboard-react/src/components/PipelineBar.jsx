import { useState } from 'react';
import { Globe, Database, Server, Cpu, BarChart3, Radio, CheckCircle, Info, X } from 'lucide-react';
import './PipelineBar.css';

const stages = [
  {
    id: 'gateway',
    icon: Globe,
    label: 'API Gateway',
    detail: 'Port 80',
    color: 'var(--accent)',
    proto: 'HTTP / TCP',
    latency: '0.8 ms',
    role: 'Reverse proxy & route dispatcher with static UI serving'
  },
  {
    id: 'redis',
    icon: Database,
    label: 'Redis Stream',
    detail: 'events:raw',
    color: '#ef4444',
    proto: 'RESP / TCP',
    latency: '0.4 ms',
    role: 'Append-only stream buffer preventing database backpressure'
  },
  {
    id: 'worker',
    icon: Cpu,
    label: 'Worker Pool',
    detail: 'pulse_workers',
    color: '#f59e0b',
    proto: 'Redis Consumer Group',
    latency: '< 2.0 ms',
    role: 'Micro-batch processor writing 500 events per cycle + HyperLogLog'
  },
  {
    id: 'mongo',
    icon: Server,
    label: 'MongoDB',
    detail: 'Port 27017',
    color: '#10b981',
    proto: 'MongoDB Wire',
    latency: '1.2 ms',
    role: 'WiredTiger ACID document store with compound & 30-day TTL index'
  },
  {
    id: 'cache',
    icon: BarChart3,
    label: 'Query Cache',
    detail: '10s TTL',
    color: '#0ea5e9',
    proto: 'Redis Cache-Aside',
    latency: '0.2 ms',
    role: 'In-memory fast lookup cache for analytics overview endpoints'
  },
  {
    id: 'socket',
    icon: Radio,
    label: 'WebSocket',
    detail: 'Socket.IO',
    color: '#8b5cf6',
    proto: 'WSS / Engine.IO',
    latency: 'Realtime',
    role: 'Bidirectional telemetry socket broadcasting stats every 2.0s'
  },
];

function PipelineBar({ isConnected }) {
  const [selectedStage, setSelectedStage] = useState(null);

  return (
    <div className="pipeline-bar" id="pipeline">
      <div className="pipeline-label">
        <span className="pipeline-label-text">Data Pipeline</span>
        <span className={`pipeline-status ${isConnected ? 'active' : ''}`}>
          {isConnected ? 'Healthy' : 'Connecting'}
        </span>
      </div>

      <div className="pipeline-stages">
        {stages.map((stage, i) => {
          const isSelected = selectedStage?.id === stage.id;
          return (
            <div key={stage.id} className="pipeline-stage-wrapper">
              <div
                className={`pipeline-stage ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedStage(isSelected ? null : stage)}
                title="Click for stage telemetry details"
              >
                <div className="stage-icon" style={{ color: stage.color }}>
                  <stage.icon size={14} />
                </div>
                <div className="stage-info">
                  <span className="stage-label">{stage.label}</span>
                  <span className="stage-detail">{stage.detail}</span>
                </div>
              </div>
              {i < stages.length - 1 && (
                <div className="pipeline-connector">
                  <div className={`connector-line ${isConnected ? 'active' : ''}`} />
                  <svg className="connector-arrow" width="6" height="8" viewBox="0 0 6 8">
                    <path d="M1 1L5 4L1 7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedStage && (
        <div className="pipeline-popover animate-fade-in">
          <div className="popover-header">
            <div className="popover-title">
              <span className="popover-dot" style={{ backgroundColor: selectedStage.color }} />
              <strong>{selectedStage.label}</strong>
              <span className="popover-proto font-mono">{selectedStage.proto}</span>
            </div>
            <button className="popover-close" onClick={() => setSelectedStage(null)}>
              <X size={12} />
            </button>
          </div>
          <p className="popover-role">{selectedStage.role}</p>
          <div className="popover-metrics">
            <span className="p-metric font-mono">P95 Latency: <strong>{selectedStage.latency}</strong></span>
            <span className="p-metric font-mono">Status: <strong className="text-success">Operational</strong></span>
          </div>
        </div>
      )}
    </div>
  );
}

export default PipelineBar;
