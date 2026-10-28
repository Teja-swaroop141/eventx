import { Server, Database, Shield, Radio, Heart, PlayCircle } from 'lucide-react';
import './Footer.css';

export default function Footer({ onOpenDemo }) {
  return (
    <footer className="saas-footer">
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="footer-logo-title">
              <span className="brand-dot" />
              <span className="footer-brand-name">Eventix</span>
              <span className="footer-badge">Cloud Engine</span>
            </div>
            <p className="footer-desc">
              High-throughput asynchronous distributed analytics ingestion platform powered by Redis Streams, MongoDB WiredTiger, and Node.js microservices.
            </p>
          </div>

          <div className="footer-services">
            <span className="services-title">Microservices Topology</span>
            <div className="services-tags">
              <span className="service-tag">
                <Shield size={11} /> Auth :3001
              </span>
              <span className="service-tag">
                <Radio size={11} /> Ingestion :3002
              </span>
              <span className="service-tag">
                <Server size={11} /> Query & WSS :3003
              </span>
              <span className="service-tag">
                <Database size={11} /> MongoDB :27017
              </span>
              <span className="service-tag">
                <span className="tag-dot" /> Redis :6379
              </span>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-copyright">
            © {new Date().getFullYear()} Eventix Distributed Analytics Platform. Enterprise Grade.
          </div>
          <div className="footer-links">
            <a href="#dashboard" className="footer-link">Live Telemetry</a>
            {onOpenDemo && (
              <button className="footer-link-btn" onClick={onOpenDemo}>
                Interactive Demo Sandbox
              </button>
            )}
            <a href="#events" className="footer-link">Event Streams</a>
            <span className="footer-sep">•</span>
            <span className="footer-uptime font-mono">System Uptime: 99.99%</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
