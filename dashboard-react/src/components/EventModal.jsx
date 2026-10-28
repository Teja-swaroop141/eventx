import { useState, useEffect } from 'react';
import { X, Copy, Check, Terminal, FileCode, CheckCircle2 } from 'lucide-react';
import './EventModal.css';

export default function EventModal({ event, onClose }) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('raw');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!event) return null;

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(event, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-left">
            <div className="modal-icon-box">
              <FileCode size={16} />
            </div>
            <div>
              <div className="modal-title-row">
                <h3 className="modal-title">Event Telemetry Inspector</h3>
                <span className="modal-tag">{event.event}</span>
              </div>
              <p className="modal-subtitle">
                ID: <span className="font-mono">{event._id || 'stream-buffer'}</span>
              </p>
            </div>
          </div>

          <div className="modal-header-actions">
            <button className="copy-json-btn" onClick={copyJson}>
              {copied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
              <span>{copied ? 'Copied' : 'Copy JSON'}</span>
            </button>
            <button className="close-btn" onClick={onClose}>
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="modal-tabs">
          <button
            className={`tab-btn ${activeTab === 'raw' ? 'active' : ''}`}
            onClick={() => setActiveTab('raw')}
          >
            Formatted JSON
          </button>
          <button
            className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
            onClick={() => setActiveTab('summary')}
          >
            Attributes Summary
          </button>
        </div>

        <div className="modal-body">
          {activeTab === 'raw' ? (
            <div className="code-viewer">
              <pre className="font-mono">
                {JSON.stringify(event, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="summary-list">
              <div className="summary-row">
                <span className="summary-label">Event Action</span>
                <span className="summary-val font-mono">{event.event}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">User Identifier</span>
                <span className="summary-val font-mono">{event.user_id || 'anonymous'}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Project ID</span>
                <span className="summary-val font-mono">{event.project_id || '1'}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Server Timestamp</span>
                <span className="summary-val font-mono">
                  {event.timestamp ? new Date(event.timestamp).toISOString() : 'N/A'}
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Properties Count</span>
                <span className="summary-val font-mono">
                  {event.properties ? Object.keys(event.properties).length : 0} attributes
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Storage Consistency</span>
                <span className="summary-val text-success">
                  <CheckCircle2 size={12} className="inline-icon" />
                  MongoDB WiredTiger Document + Redis Aggregator
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <span className="modal-footer-hint">
            Press <kbd>Esc</kbd> or click outside to dismiss
          </span>
          <button className="btn-done" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
