import { useState } from 'react';
import { ShieldCheck, ArrowRight, Lock, Mail } from 'lucide-react';
import './AuthBanner.css';

export default function AuthBanner({ isAuthenticated, onAuth }) {
  const [email, setEmail] = useState('admin@eventix.io');
  const [password, setPassword] = useState('EventixAdmin123!');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onAuth(email, password);
    } catch (err) {
      alert('Authentication failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`auth-card ${isAuthenticated ? 'authenticated' : ''}`}>
      <div className="auth-left">
        <div className="auth-icon-wrap">
          <ShieldCheck size={18} className="auth-icon" />
        </div>
        <div className="auth-info">
          <div className="auth-title-line">
            <h3 className="auth-title">Gateway Authentication</h3>
            <span className={`auth-status-pill ${isAuthenticated ? 'active' : ''}`}>
              {isAuthenticated ? 'Session Active' : 'Unauthenticated'}
            </span>
          </div>
          <p className="auth-desc">
            Stateless JWT verification active across distributed Ingest, Query, and Worker nodes.
          </p>
        </div>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-input-group">
          <Mail size={14} className="input-icon" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@eventix.io"
            className="auth-input"
            required
          />
        </div>

        <div className="auth-input-group">
          <Lock size={14} className="input-icon" />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            className="auth-input"
            required
          />
        </div>

        <button type="submit" className="auth-submit-btn" disabled={loading}>
          <span>{loading ? 'Authenticating...' : isAuthenticated ? 'Authenticated' : 'Sign In'}</span>
          {!loading && <ArrowRight size={13} />}
        </button>
      </form>
    </div>
  );
}
