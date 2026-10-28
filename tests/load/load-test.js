/**
 * PulseTrack Ingestion Benchmark & Stress Test (Node.js native)
 * 
 * Tests throughput, concurrency, latency percentiles, and rate limits.
 * 
 * Usage:
 *   node tests/load/load-test.js
 * 
 * Options via environment variables:
 *   BASE_URL=http://localhost/api
 *   CONCURRENCY=20
 *   TOTAL_REQUESTS=1000
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost/api';
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '20', 10);
const TOTAL_REQUESTS = parseInt(process.env.TOTAL_REQUESTS || '1000', 10);

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  return { ok: response.ok, status: response.status, data };
}

function percentile(arr, p) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

async function runBenchmark() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('⚡ PulseTrack Ingestion Stress & Throughput Benchmark');
  console.log(`🎯 Target: ${BASE_URL}/events/ingest`);
  console.log(`👥 Concurrency: ${CONCURRENCY} virtual clients`);
  console.log(`📦 Total Requests: ${TOTAL_REQUESTS}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Setup: Register & get API Key
  const uniqueId = Math.random().toString(36).substring(7);
  const email = `benchmark_${uniqueId}@pulsetrack.io`;
  const password = 'BenchmarkPassword123!';

  console.log('1️⃣  Setting up benchmark user and API key...');
  await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  const loginRes = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  const token = loginRes.data.token;
  const projRes = await request('/auth/projects', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name: `Benchmark Project ${uniqueId}` }),
  });

  const projectId = projRes.data.project.id;
  const keyRes = await request(`/auth/projects/${projectId}/keys`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

  const apiKey = keyRes.data.apiKey.key;
  console.log(`   ✅ API Key ready: ${apiKey}`);
  console.log('2️⃣  Commencing load generation...\n');

  let completed = 0;
  let statusCodes = {};
  let latencies = [];
  const testStart = Date.now();

  async function worker(workerId) {
    while (true) {
      const current = completed++;
      if (current >= TOTAL_REQUESTS) break;

      const payload = {
        project_id: projectId,
        event: 'benchmark_ping',
        user_id: `bench_user_${workerId}`,
        properties: { req_num: current, timestamp: Date.now() },
      };

      const start = performance.now();
      try {
        const res = await request('/events/ingest', {
          method: 'POST',
          headers: { 'X-API-Key': apiKey },
          body: JSON.stringify(payload),
        });
        const elapsed = performance.now() - start;
        latencies.push(elapsed);
        statusCodes[res.status] = (statusCodes[res.status] || 0) + 1;
      } catch (err) {
        statusCodes['error'] = (statusCodes['error'] || 0) + 1;
      }

      if ((current + 1) % 100 === 0 || current + 1 === TOTAL_REQUESTS) {
        const elapsedSec = ((Date.now() - testStart) / 1000).toFixed(1);
        const rps = Math.round((current + 1) / Math.max(0.1, (Date.now() - testStart) / 1000));
        process.stdout.write(`   🚀 Completed ${current + 1}/${TOTAL_REQUESTS} requests (${elapsedSec}s, ~${rps} req/s)\r`);
      }
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, (_, i) => worker(i));
  await Promise.all(workers);

  const totalTimeMs = Date.now() - testStart;
  const totalTimeSec = totalTimeMs / 1000;
  const rps = (TOTAL_REQUESTS / totalTimeSec).toFixed(1);

  const avgLatency = (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(2);
  const p50 = percentile(latencies, 50).toFixed(2);
  const p95 = percentile(latencies, 95).toFixed(2);
  const p99 = percentile(latencies, 99).toFixed(2);

  console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Benchmark Results');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`⏱️  Total Duration:     ${totalTimeSec.toFixed(2)} seconds`);
  console.log(`⚡ Throughput:         ${rps} requests/second`);
  console.log(`📉 Avg Latency:        ${avgLatency} ms`);
  console.log(`📊 50th Percentile:    ${p50} ms`);
  console.log(`📊 95th Percentile:    ${p95} ms`);
  console.log(`📊 99th Percentile:    ${p99} ms`);
  console.log('\nHTTP Status Distribution:');
  for (const [code, count] of Object.entries(statusCodes)) {
    const pct = ((count / TOTAL_REQUESTS) * 100).toFixed(1);
    console.log(`   ${code}: ${count} (${pct}%)`);
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

runBenchmark().catch(err => {
  console.error('\n❌ Benchmark error:', err.message);
  process.exit(1);
});
