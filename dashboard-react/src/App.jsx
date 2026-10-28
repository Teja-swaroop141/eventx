import { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from './components/Navbar';
import AuthBanner from './components/AuthBanner';
import PipelineBar from './components/PipelineBar';
import EventSimulator from './components/EventSimulator';
import MetricsGrid from './components/MetricsGrid';
import ChartsSection from './components/ChartsSection';
import InsightsGrid from './components/InsightsGrid';
import EventsTable from './components/EventsTable';
import EventModal from './components/EventModal';
import DemoSandboxPage from './components/DemoSandboxPage';
import Footer from './components/Footer';
import api from './services/api';
import { connectSocket, onSocketEvent, disconnectSocket } from './services/socket';
import { Sparkles, ArrowRight, Zap } from 'lucide-react';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'demo'
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [stats, setStats] = useState({
    total_events: 0,
    unique_users: 0,
    events_today: 0,
    by_type: { page_view: 0, signup: 0, purchase: 0, button_click: 0 }
  });
  const [events, setEvents] = useState([]);
  const [liveData, setLiveData] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const pollRef = useRef(null);

  const fetchData = useCallback(async () => {
    if (!api.token) return;
    try {
      const [statsData, eventsData] = await Promise.all([
        api.fetchRealtimeStats(),
        api.fetchEvents()
      ]);
      setStats(statsData);
      setEvents(eventsData.events || []);

      setLiveData(prev => {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const next = [...prev, { time, total: statsData.total_events || 0, today: statsData.events_today || 0 }];
        return next.length > 30 ? next.slice(-30) : next;
      });
    } catch (err) {
      console.error('Data fetch error:', err);
    }
  }, []);

  const handleAuth = useCallback(async (email, password) => {
    await api.login(email, password);
    await api.fetchProjects();
    setIsAuthenticated(true);

    connectSocket();

    const unsub1 = onSocketEvent('connection', ({ connected }) => {
      setIsConnected(connected);
    });

    const unsub2 = onSocketEvent('stats', (data) => {
      setStats(prev => ({ ...prev, ...data }));
      setLiveData(prev => {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const next = [...prev, { time, total: data.total_events || 0, today: data.events_today || 0 }];
        return next.length > 30 ? next.slice(-30) : next;
      });
    });

    const unsub3 = onSocketEvent('alert', (data) => {
      setAlerts(prev => [data, ...prev].slice(0, 10));
    });

    fetchData();
    pollRef.current = setInterval(fetchData, 4000);

    return () => {
      unsub1();
      unsub2();
      unsub3();
      clearInterval(pollRef.current);
      disconnectSocket();
    };
  }, [fetchData]);

  useEffect(() => {
    // Auto-login with demo credentials
    handleAuth('admin@eventix.io', 'EventixAdmin123!').catch(() => {
      handleAuth('admin@pulsetrack.io', 'PulseAdmin123!').catch(() => {});
    });

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      disconnectSocket();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleIngestEvent = async (eventType, properties, userId = null) => {
    const assignedUser = userId || `usr_${Math.floor(Math.random() * 9000 + 1000)}`;
    const tempId = 'sim_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const newEvt = {
      _id: tempId,
      event: eventType,
      user_id: assignedUser,
      properties: { ...properties, simulated: true },
      timestamp: Date.now(),
      status: 'Persisted'
    };

    // 1. Immediately prepend to events state so ledger updates with 0ms delay
    setEvents(prev => [newEvt, ...prev.slice(0, 99)]);

    // 2. Optimistically bump stats counters
    setStats(prev => ({
      ...prev,
      total_events: (prev.total_events || 0) + 1,
      events_today: (prev.events_today || 0) + 1,
      by_type: {
        ...prev.by_type,
        [eventType]: (prev.by_type?.[eventType] || 0) + 1
      }
    }));

    // 3. Send to backend pipeline
    await api.ingestEvent(eventType, properties, assignedUser);

    // 4. Re-sync from MongoDB once worker has written batch
    setTimeout(fetchData, 450);
  };

  const handleSurge = async () => {
    const types = ['page_view', 'button_click', 'signup', 'purchase'];
    const now = Date.now();
    const optimisticSurge = [];
    for (let i = 0; i < 20; i++) {
      const t = types[i % types.length];
      optimisticSurge.push({
        _id: `surge_${now}_${i}`,
        event: t,
        user_id: `usr_${Math.floor(Math.random() * 9000 + 1000)}`,
        properties: { source: 'dashboard_surge_sim', seq: i + 1, simulated: true },
        timestamp: now + i * 2,
        status: 'Persisted'
      });
    }

    setEvents(prev => [...optimisticSurge, ...prev].slice(0, 100));
    setStats(prev => ({
      ...prev,
      total_events: (prev.total_events || 0) + 20,
      events_today: (prev.events_today || 0) + 20
    }));

    await api.sendSurge(20);
    setTimeout(fetchData, 700);
  };

  return (
    <div className="app-layout">
      <Navbar
        isConnected={isConnected}
        isAuthenticated={isAuthenticated}
        apiKey={api.apiKey}
        alerts={alerts}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      <main className="app-container">
        {activeTab === 'demo' ? (
          <DemoSandboxPage
            onSendEvent={handleIngestEvent}
            onSurge={handleSurge}
            onNavigateDashboard={() => setActiveTab('dashboard')}
          />
        ) : (
          <>
            {/* TaskGo-style Hero Header */}
            <section className="hero-section">
              <div className="hero-pill-tag">
                <Sparkles size={13} className="hero-sparkle" />
                <span>Sub-Millisecond Ingestion & Distributed Analytics</span>
              </div>
              <h1 className="hero-title">
                Simplify Telemetry Ingestion <br />
                <span className="hero-title-gradient">Boost Real-Time Intelligence</span>
              </h1>
              <p className="hero-subtitle">
                Ingest, buffer, and analyze millions of telemetry events in real time. Powered by Redis Streams, MongoDB WiredTiger, and persistent WebSocket streams.
              </p>
            </section>

            <AuthBanner
              isAuthenticated={isAuthenticated}
              onAuth={handleAuth}
            />

            <PipelineBar isConnected={isConnected} />

            {isAuthenticated && (
              <>
                <EventSimulator
                  onSendEvent={handleIngestEvent}
                  onSurge={handleSurge}
                  onOpenDemo={() => setActiveTab('demo')}
                />

                <MetricsGrid stats={stats} />

                <ChartsSection
                  liveData={liveData}
                  byType={stats.by_type}
                />

                <InsightsGrid events={events} />

                <EventsTable
                  events={events}
                  onInspect={setSelectedEvent}
                />
              </>
            )}
          </>
        )}
      </main>

      <Footer onOpenDemo={() => setActiveTab('demo')} />

      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
}

export default App;
