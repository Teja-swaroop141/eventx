/**
 * Eventix Master Orchestrator
 * Starts database dependencies, microservices, and the API gateway concurrently.
 */

const { spawn, execSync } = require('child_process');
const net = require('net');
const path = require('path');
const fs = require('fs');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🚀 Launching Eventix Distributed Analytics Platform');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const MONGOD_PATH = 'C:\\Program Files\\MongoDB\\Server\\9.0\\bin\\mongod.exe';
const MONGO_DATA_DIR = path.resolve(__dirname, 'data/mongodb');

const services = [
  {
    name: 'AUTH   ',
    color: '\x1b[36m', // Cyan
    script: 'services/auth/src/index.js',
    env: {
      PORT: '3001',
      PG_HOST: 'localhost',
      PG_PORT: '5433',
      PG_USER: 'pulse_admin',
      PG_PASSWORD: 'pulse_secret',
      PG_DATABASE: 'pulsetrack',
      JWT_SECRET: 'pulsetrack-dev-secret-change-in-production',
    },
  },
  {
    name: 'INGEST ',
    color: '\x1b[32m', // Green
    script: 'services/ingestion/src/index.js',
    env: {
      PORT: '3002',
      REDIS_HOST: 'localhost',
      REDIS_PORT: '6379',
      PG_HOST: 'localhost',
      PG_PORT: '5433',
      PG_USER: 'pulse_admin',
      PG_PASSWORD: 'pulse_secret',
      PG_DATABASE: 'pulsetrack',
    },
  },
  {
    name: 'WORKER ',
    color: '\x1b[33m', // Yellow
    script: 'services/worker/src/index.js',
    env: {
      REDIS_HOST: 'localhost',
      REDIS_PORT: '6379',
      MONGO_HOST: 'localhost',
      MONGO_PORT: '27017',
      MONGO_DB: 'pulsetrack',
      WORKER_SLOT: '0',
      TOTAL_WORKER_SLOTS: '1',
      ALERT_SPIKE_THRESHOLD: '500',
    },
  },
  {
    name: 'QUERY  ',
    color: '\x1b[35m', // Magenta
    script: 'services/query/src/index.js',
    env: {
      PORT: '3003',
      REDIS_HOST: 'localhost',
      REDIS_PORT: '6379',
      MONGO_HOST: 'localhost',
      MONGO_PORT: '27017',
      MONGO_DB: 'pulsetrack',
      JWT_SECRET: 'pulsetrack-dev-secret-change-in-production',
    },
  },
  {
    name: 'GATEWAY',
    color: '\x1b[34m', // Blue
    script: 'gateway.js',
    env: {
      GATEWAY_PORT: '80',
    },
  },
];

const processes = [];
const resetColor = '\x1b[0m';

function checkPort(port, host = '127.0.0.1', timeout = 1000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let isConnected = false;
    socket.setTimeout(timeout);
    socket.once('connect', () => {
      isConnected = true;
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

async function waitForPort(port, host = '127.0.0.1', maxRetries = 25, delayMs = 300) {
  for (let i = 0; i < maxRetries; i++) {
    if (await checkPort(port, host, 500)) {
      return true;
    }
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return false;
}

async function ensureDependencies() {
  console.log('🔍 Checking infrastructure dependencies (Redis, PostgreSQL, MongoDB)...');

  // 1. Check & start Docker containers if needed
  const isRedisUp = await checkPort(6379);
  const isPgUp = await checkPort(5433);

  if (!isRedisUp || !isPgUp) {
    console.log('🐳 Starting Docker dependencies (pulse_redis, pulse_postgres)...');
    try {
      execSync('docker start pulse_redis pulse_postgres', { stdio: 'ignore' });
    } catch {}

    const redisReady = await waitForPort(6379, '127.0.0.1', 10);
    const pgReady = await waitForPort(5433, '127.0.0.1', 10);

    if (redisReady) console.log('   ✅ Redis is active on port 6379');
    else console.warn('   ⚠️  Redis is not reachable on port 6379');

    if (pgReady) console.log('   ✅ PostgreSQL is active on port 5433');
    else console.warn('   ⚠️  PostgreSQL is not reachable on port 5433');
  } else {
    console.log('   ✅ Redis (6379) and PostgreSQL (5433) are active');
  }

  // 2. Check & start MongoDB
  const isMongoUp = await checkPort(27017);
  if (!isMongoUp) {
    console.log('🍃 MongoDB is not running on 27017. Launching local instance...');
    if (!fs.existsSync(MONGO_DATA_DIR)) {
      fs.mkdirSync(MONGO_DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(MONGOD_PATH)) {
      const mongoProc = spawn(MONGOD_PATH, [
        '--dbpath', MONGO_DATA_DIR,
        '--port', '27017',
        '--bind_ip', '127.0.0.1',
      ], {
        stdio: 'ignore',
        detached: false,
      });

      mongoProc.on('error', (err) => {
        console.error('❌ Failed to launch mongod.exe:', err.message);
      });

      processes.push(mongoProc);

      const mongoReady = await waitForPort(27017, '127.0.0.1', 30, 400);
      if (mongoReady) {
        console.log('   ✅ MongoDB initialized and listening on 127.0.0.1:27017\n');
      } else {
        console.error('   ❌ MongoDB did not start within the expected timeout.\n');
      }
    } else {
      console.warn(`   ⚠️ mongod.exe not found at "${MONGOD_PATH}". Please start MongoDB on port 27017 manually.\n`);
    }
  } else {
    console.log('   ✅ MongoDB is active on 127.0.0.1:27017\n');
  }
}

function launchServices() {
  for (const svc of services) {
    const child = spawn(process.execPath, [path.resolve(__dirname, svc.script)], {
      env: { ...process.env, ...svc.env },
      cwd: __dirname,
    });

    child.stdout.on('data', (data) => {
      const lines = data.toString().trim().split('\n');
      for (const line of lines) {
        if (line.trim()) {
          console.log(`${svc.color}[${svc.name}]${resetColor} ${line}`);
        }
      }
    });

    child.stderr.on('data', (data) => {
      const lines = data.toString().trim().split('\n');
      for (const line of lines) {
        if (line.trim()) {
          console.error(`${svc.color}[${svc.name} ERROR]${resetColor} ${line}`);
        }
      }
    });

    child.on('error', (err) => {
      console.error(`${svc.color}[${svc.name} ERROR]${resetColor} Process failed to start: ${err.message}`);
    });

    child.on('exit', (code, signal) => {
      const reason = code !== null ? `code ${code}` : (signal ? `signal ${signal}` : 'abrupt termination');
      console.log(`${svc.color}[${svc.name}]${resetColor} stopped (${reason})`);
    });

    processes.push(child);
  }
}

let isShuttingDown = false;
function shutdown() {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log('\n🛑 Gracefully shutting down all Eventix services...');

  for (const proc of processes) {
    try {
      if (process.platform === 'win32' && proc.pid) {
        execSync(`taskkill /F /T /PID ${proc.pid}`, { stdio: 'ignore' });
      } else {
        proc.kill('SIGINT');
      }
    } catch {}
  }
  setTimeout(() => process.exit(0), 600);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Main entry
(async () => {
  try {
    await ensureDependencies();
    launchServices();
  } catch (err) {
    console.error('Fatal initialization error:', err.message);
    process.exit(1);
  }
})();
