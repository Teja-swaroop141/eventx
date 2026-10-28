const BASE = '';

class ApiService {
  constructor() {
    this.token = '';
    this.apiKey = '';
    this.projectId = '1';
  }

  setToken(token) {
    this.token = token;
  }

  setApiKey(key) {
    this.apiKey = key;
  }

  setProjectId(id) {
    this.projectId = id;
  }

  authHeaders() {
    return {
      'Content-Type': 'application/json',
      ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {})
    };
  }

  async login(email, password) {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Authentication failed');
    this.token = data.token;
    return data;
  }

  async fetchProjects() {
    const res = await fetch(`${BASE}/api/auth/projects`, {
      headers: this.authHeaders()
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (data.projects && data.projects.length > 0) {
      // Pick project 1 or the first project
      const proj = data.projects.find(p => p.id === 1 || p.id === '1') || data.projects[0];
      this.projectId = String(proj.id);
      this.apiKey = proj.api_key || '';

      // If no active key exists on the project, auto-generate one
      if (!this.apiKey) {
        try {
          const keyRes = await fetch(`${BASE}/api/auth/projects/${this.projectId}/keys`, {
            method: 'POST',
            headers: this.authHeaders()
          });
          if (keyRes.ok) {
            const keyData = await keyRes.json();
            if (keyData.apiKey && keyData.apiKey.key) {
              this.apiKey = keyData.apiKey.key;
            }
          }
        } catch {}
      }
    }
    return data.projects || [];
  }

  async fetchRealtimeStats() {
    const res = await fetch(`${BASE}/api/query/stats/realtime?project_id=${this.projectId}`, {
      headers: this.authHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  }

  async fetchEvents() {
    const res = await fetch(`${BASE}/api/query/events/list`, {
      headers: this.authHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch events');
    return res.json();
  }

  async ensureApiKey() {
    if (!this.apiKey) {
      await this.fetchProjects();
    }
    return this.apiKey;
  }

  async ingestEvent(eventType, properties, userId = null) {
    const key = await this.ensureApiKey();
    const now = Date.now();
    const payload = {
      event: eventType,
      project_id: parseInt(this.projectId, 10) || 1,
      user_id: userId || `usr_${Math.floor(Math.random() * 9000 + 1000)}`,
      timestamp: now,
      properties: {
        ...properties,
        client_timestamp: now,
        simulated: true
      }
    };

    const res = await fetch(`${BASE}/api/events/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': key
      },
      body: JSON.stringify(payload)
    });
    const resData = await res.json().catch(() => ({}));
    return { ok: res.status === 202, status: res.status, data: resData, payload };
  }

  async sendSurge(count = 20) {
    const types = ['page_view', 'button_click', 'signup', 'purchase'];
    const promises = [];
    for (let i = 0; i < count; i++) {
      const t = types[i % types.length];
      promises.push(this.ingestEvent(t, { source: 'dashboard_surge_sim', seq: i }));
    }
    return Promise.all(promises);
  }
}

export const api = new ApiService();
export default api;
