/**
 * PulseTrack Database & Pipeline Seeder
 * 
 * Usage:
 *   node scripts/seed.js
 * 
 * Options via environment variables:
 *   API_BASE=http://localhost/api (default)
 *   EVENT_COUNT=150 (default)
 */

const BASE_URL = process.env.API_BASE || 'http://localhost/api';
const TOTAL_EVENTS = parseInt(process.env.EVENT_COUNT || '150', 10);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

async function seed() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('⚡ PulseTrack Seed Engine');
  console.log(`📡 Target API Gateway: ${BASE_URL}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const email = process.env.SEED_EMAIL || 'admin@pulsetrack.io';
  const password = process.env.SEED_PASSWORD || 'PulseAdmin123!';

  // 1. Register or Login
  console.log(`👤 1. Authenticating user (${email})...`);
  let regRes = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  let token = null;
  if (regRes.ok) {
    console.log('   ✅ User registered successfully.');
  } else {
    console.log('   ℹ️  User already exists or registered. Logging in...');
  }

  const loginRes = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  if (!loginRes.ok) {
    throw new Error(`Failed to log in: ${JSON.stringify(loginRes.data)}`);
  }

  token = loginRes.data.token;
  console.log('   ✅ Logged in successfully. JWT Token acquired.\n');

  // 2. Fetch or Create Project
  console.log('📁 2. Ensuring demo project exists...');
  const projectsRes = await request('/auth/projects', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });

  let project = null;
  if (projectsRes.ok && Array.isArray(projectsRes.data.projects) && projectsRes.data.projects.length > 0) {
    project = projectsRes.data.projects[0];
    console.log(`   ℹ️  Found existing project: "${project.name}" (ID: ${project.id})`);
  } else {
    const createRes = await request('/auth/projects', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: 'PulseStore Production' }),
    });

    if (!createRes.ok) {
      throw new Error(`Failed to create project: ${JSON.stringify(createRes.data)}`);
    }
    project = createRes.data.project;
    console.log(`   ✅ Created new project: "${project.name}" (ID: ${project.id})`);
  }
  console.log();

  // 3. Obtain API Key
  console.log('🔑 3. Getting API key for project...');
  let apiKey = null;
  const keyGenRes = await request(`/auth/projects/${project.id}/keys`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (keyGenRes.ok && keyGenRes.data.apiKey) {
    apiKey = keyGenRes.data.apiKey.key;
    console.log(`   ✅ Generated API Key: ${apiKey}\n`);
  } else {
    throw new Error(`Failed to generate API key: ${JSON.stringify(keyGenRes.data)}`);
  }

  // 4. Generate & Ingest Events
  console.log(`🚀 4. Ingesting ${TOTAL_EVENTS} realistic analytics events into Redis Streams...`);
  const eventTypes = ['page_view', 'button_click', 'signup', 'purchase'];
  const pages = ['/home', '/pricing', '/features', '/docs', '/checkout', '/dashboard'];
  const browsers = ['Chrome', 'Firefox', 'Safari', 'Edge'];
  const devices = ['desktop', 'mobile', 'tablet'];
  const users = Array.from({ length: 25 }, (_, i) => `usr_${1000 + i}`);

  let ingestedCount = 0;
  const startTime = Date.now();

  for (let i = 0; i < TOTAL_EVENTS; i++) {
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const user = users[Math.floor(Math.random() * users.length)];
    const page = pages[Math.floor(Math.random() * pages.length)];
    const browser = browsers[Math.floor(Math.random() * browsers.length)];
    const device = devices[Math.floor(Math.random() * devices.length)];

    let properties = {
      path: page,
      browser,
      device,
      referrer: 'https://google.com/search',
    };

    if (eventType === 'purchase') {
      properties.amount = (Math.random() * 150 + 10).toFixed(2);
      properties.currency = 'USD';
      properties.item_count = Math.floor(Math.random() * 4) + 1;
    } else if (eventType === 'button_click') {
      properties.button_id = ['cta-start-free', 'nav-pricing', 'dark-toggle', 'order-submit'][i % 4];
    }

    const payload = {
      project_id: project.id,
      event: eventType,
      user_id: user,
      properties,
      timestamp: Date.now() - Math.floor(Math.random() * 3600 * 1000), // within last hour
    };

    const ingestRes = await request('/events/ingest', {
      method: 'POST',
      headers: { 'X-API-Key': apiKey },
      body: JSON.stringify(payload),
    });

    if (ingestRes.status === 202) {
      ingestedCount++;
      if (ingestedCount % 25 === 0 || ingestedCount === TOTAL_EVENTS) {
        process.stdout.write(`   📊 Progress: ${ingestedCount}/${TOTAL_EVENTS} events accepted (202 Accepted)\r`);
      }
    } else {
      console.warn(`\n   ⚠️ Warning on event ${i}: HTTP ${ingestRes.status} - ${JSON.stringify(ingestRes.data)}`);
    }

    // Small delay to prevent hitting 1000 req/s rate-limiting
    await sleep(15);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n\n   ✅ Successfully ingested ${ingestedCount} events in ${elapsed}s!`);
  console.log('   ⏳ Waiting 3 seconds for Worker replicas to persist events to MongoDB & Redis counters...');
  await sleep(3000);

  // 5. Verify Query Stats
  console.log('\n📈 5. Verifying Query Service analytics...');
  const statsRes = await request(`/query/stats/realtime?project_id=${project.id}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (statsRes.ok) {
    console.log('   ✅ Real-time stats returned:');
    console.log(`      • Total Events:  ${statsRes.data.total_events}`);
    console.log(`      • Unique Users:  ${statsRes.data.unique_users}`);
    console.log(`      • Events Today:  ${statsRes.data.events_today}`);
    console.log('      • Event Breakdown:', JSON.stringify(statsRes.data.by_type));
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 Seeding Complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('You can now open the Dashboard in your browser:');
  console.log('👉 http://localhost/');
  console.log(`Login Credentials:`);
  console.log(`   Email:    ${email}`);
  console.log(`   Password: ${password}`);
  console.log(`   API Key:  ${apiKey}`);
  console.log(`   Project:  ID ${project.id} ("${project.name}")`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

seed().catch((err) => {
  console.error('\n❌ Seeding failed:', err.message);
  process.exit(1);
});
