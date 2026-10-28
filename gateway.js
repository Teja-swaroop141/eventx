const http = require('http');
const fs = require('fs');
const path = require('path');
const httpProxy = require('http-proxy');

const PORT = parseInt(process.env.GATEWAY_PORT || '80', 10);
const DASHBOARD_DIR = path.join(__dirname, 'dashboard');

// Create proxy instance
const proxy = httpProxy.createProxyServer({
  ws: true,
  changeOrigin: true,
});

proxy.on('error', (err, req, res) => {
  const errMsg = err && (err.message || err.code || String(err));
  console.error(`[Gateway Proxy Error] ${req.method || 'WS'} ${req.url || '/'}:`, errMsg);
  if (res && typeof res.writeHead === 'function' && !res.headersSent) {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Bad Gateway', message: errMsg }));
  } else if (res && typeof res.destroy === 'function') {
    res.destroy();
  }
});

const server = http.createServer((req, res) => {
  const url = req.url;

  // 1. Health check
  if (url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'gateway' }));
    return;
  }

  // 2. Auth Service routing: /api/auth/* -> http://localhost:3001
  if (url.startsWith('/api/auth/')) {
    proxy.web(req, res, { target: 'http://localhost:3001' });
    return;
  }

  // 3. Ingestion Service routing: /api/events/* -> http://localhost:3002
  if (url.startsWith('/api/events/')) {
    proxy.web(req, res, { target: 'http://localhost:3002' });
    return;
  }

  // 4. Query Service routing: /api/query/* -> http://localhost:3003 (with rewrite)
  if (url.startsWith('/api/query/')) {
    // Strip '/api/query' prefix so query service receives '/analytics/...' or '/stats/...'
    req.url = url.replace(/^\/api\/query/, '') || '/';
    proxy.web(req, res, { target: 'http://localhost:3003' });
    return;
  }

  // 5. Static Dashboard UI: Serve dashboard files
  const cleanPath = url.split('?')[0];
  let filePath = path.join(DASHBOARD_DIR, cleanPath === '/' ? 'index.html' : cleanPath);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DASHBOARD_DIR, 'index.html');
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.mjs': 'application/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf',
    };

    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    res.end(content);
  });
});

// WebSocket support for Socket.IO live dashboard
server.on('upgrade', (req, socket, head) => {
  const url = req.url;
  if (url.startsWith('/api/query/socket.io') || url.startsWith('/socket.io')) {
    req.url = url.replace(/^\/api\/query/, '');
    proxy.ws(req, socket, head, { target: 'http://localhost:3003' });
  } else {
    socket.destroy();
  }
});

server.listen(PORT, () => {
  console.log(`🌐 Eventix Gateway & Dashboard active at http://localhost:${PORT}/`);
  console.log(`   ├── /api/auth/*   ──> Auth Service (Port 3001)`);
  console.log(`   ├── /api/events/* ──> Ingestion Service (Port 3002)`);
  console.log(`   ├── /api/query/*  ──> Query Service & WebSockets (Port 3003)`);
  console.log(`   └── /             ──> Dashboard Web UI`);
});

module.exports = server;
