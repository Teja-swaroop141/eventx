import { useState, useMemo } from 'react';
import {
  ListFilter,
  Search,
  Eye,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Radio,
  Download,
  X,
  FileJson,
  FileSpreadsheet
} from 'lucide-react';
import './EventsTable.css';

const EVENT_PILL_STYLES = {
  page_view: { bg: '#eef2ff', text: '#4f46e5', border: '#c7d2fe' },
  signup: { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' },
  purchase: { bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
  button_click: { bg: '#f0f9ff', text: '#0284c7', border: '#bae6fd' }
};

export default function EventsTable({ events = [], onInspect }) {
  const [filterType, setFilterType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Filtered list
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      const matchType = filterType === 'ALL' || e.event === filterType;
      const matchSearch = !searchQuery ||
        (e.user_id && e.user_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (e.event && e.event.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (e.properties && JSON.stringify(e.properties).toLowerCase().includes(searchQuery.toLowerCase()));
      return matchType && matchSearch;
    });
  }, [events, filterType, searchQuery]);

  const totalPages = Math.ceil(filteredEvents.length / pageSize) || 1;
  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredEvents.slice(start, start + pageSize);
  }, [filteredEvents, currentPage, pageSize]);

  const handleFilterChange = (type) => {
    setFilterType(type);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilterType('ALL');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const exportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredEvents, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute('href', dataStr);
    dl.setAttribute('download', `eventix_events_${Date.now()}.json`);
    dl.click();
  };

  const exportCSV = () => {
    const headers = ['id', 'timestamp', 'event', 'user_id', 'properties'];
    const rows = filteredEvents.map(e => [
      e._id || '',
      e.timestamp ? new Date(e.timestamp).toISOString() : '',
      e.event || '',
      e.user_id || '',
      `"${JSON.stringify(e.properties || {}).replace(/"/g, '""')}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const dl = document.createElement('a');
    dl.setAttribute('href', encodeURI(csvContent));
    dl.setAttribute('download', `eventix_events_${Date.now()}.csv`);
    dl.click();
  };

  const formatTimestamp = (ts) => {
    if (!ts) return 'just now';
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
        ' · ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return String(ts);
    }
  };

  const hasActiveFilters = filterType !== 'ALL' || searchQuery.trim() !== '';

  return (
    <section className="events-section" id="events">
      <div className="events-header">
        <div className="events-header-left">
          <div className="table-icon-box">
            <Radio size={16} className="live-stream-icon" />
          </div>
          <div>
            <div className="table-title-row">
              <h3 className="events-title">Real-Time Event Stream Ledger</h3>
              <span className="live-counter-pill font-mono">{filteredEvents.length} buffered</span>
            </div>
            <p className="events-subtitle">
              Live immutable telemetry buffer persisted to MongoDB WiredTiger
            </p>
          </div>
        </div>

        <div className="events-header-controls">
          {/* Search box */}
          <div className="search-box">
            <Search size={14} className="search-icon" />
            <input
              type="text"
              placeholder="Filter by user, action, payload..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="search-input"
            />
            {searchQuery && (
              <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
                <X size={12} />
              </button>
            )}
          </div>

          {/* Type filter tabs */}
          <div className="filter-pill-group">
            {['ALL', 'page_view', 'signup', 'purchase', 'button_click'].map((t) => (
              <button
                key={t}
                className={`filter-btn ${filterType === t ? 'active' : ''}`}
                onClick={() => handleFilterChange(t)}
              >
                {t === 'ALL' ? 'All Events' : t.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Export buttons */}
          <div className="export-btn-group">
            <button className="export-btn" onClick={exportCSV} title="Export filtered events to CSV">
              <FileSpreadsheet size={13} />
              <span>CSV</span>
            </button>
            <button className="export-btn" onClick={exportJSON} title="Export filtered events to JSON">
              <FileJson size={13} />
              <span>JSON</span>
            </button>
          </div>

          {hasActiveFilters && (
            <button className="reset-filters-btn" onClick={handleClearFilters}>
              <X size={12} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      <div className="table-container">
        <table className="events-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Event Action</th>
              <th>User Identifier</th>
              <th>Telemetry Properties</th>
              <th>Status</th>
              <th className="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedEvents.length === 0 ? (
              <tr>
                <td colSpan={6} className="table-empty">
                  No telemetry events match your criteria.{' '}
                  {hasActiveFilters ? (
                    <button className="empty-reset-link" onClick={handleClearFilters}>
                      Clear active filters
                    </button>
                  ) : (
                    'Send an event using the simulator above.'
                  )}
                </td>
              </tr>
            ) : (
              paginatedEvents.map((evt, idx) => {
                const style = EVENT_PILL_STYLES[evt.event] || {
                  bg: '#f1f5f9',
                  text: '#64748b',
                  border: '#cbd5e1'
                };

                return (
                  <tr key={evt._id || idx} className="table-row">
                    <td className="col-time font-mono">
                      <Clock size={12} className="inline-icon" />
                      <span>{formatTimestamp(evt.timestamp)}</span>
                    </td>
                    <td className="col-event">
                      <span
                        className="event-badge"
                        style={{
                          backgroundColor: style.bg,
                          color: style.text,
                          borderColor: style.border
                        }}
                      >
                        {evt.event}
                      </span>
                    </td>
                    <td className="col-user font-mono">
                      <span className="user-avatar-mini">
                        <User size={11} />
                      </span>
                      <span>{evt.user_id || 'anonymous'}</span>
                    </td>
                    <td className="col-props">
                      <span className="props-preview font-mono">
                        {evt.properties
                          ? JSON.stringify(evt.properties).slice(0, 58) +
                            (JSON.stringify(evt.properties).length > 58 ? '...' : '')
                          : '{}'}
                      </span>
                    </td>
                    <td className="col-status">
                      <span className="ingested-badge">
                        <span className="ingested-dot" />
                        Persisted
                      </span>
                    </td>
                    <td className="col-action text-right">
                      <button
                        className="inspect-btn"
                        onClick={() => onInspect(evt)}
                        title="Inspect Event Payload"
                      >
                        <Eye size={13} />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination & Status Footer */}
      <div className="table-footer">
        <div className="table-status">
          Showing <span className="font-mono">{paginatedEvents.length}</span> of{' '}
          <span className="font-mono">{filteredEvents.length}</span> recorded telemetry logs
        </div>

        <div className="pagination-controls">
          <button
            className="page-btn"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          >
            <ChevronLeft size={14} />
            <span>Prev</span>
          </button>
          <span className="page-indicator font-mono">
            {currentPage} / {totalPages}
          </span>
          <button
            className="page-btn"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          >
            <span>Next</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </section>
  );
}
