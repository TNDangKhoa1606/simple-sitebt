const statusEl = document.getElementById('status');
const infoBody = document.getElementById('infoBody');

function setCheckStatus(check, ok, detail) {
  const item = document.querySelector(`[data-check="${check}"]`);
  if (!item) return;
  const status = item.querySelector('.check-status');
  status.textContent = ok ? '✅' : '❌';
  if (detail) {
    item.title = detail;
  }
}

function setOverallStatus(text, isError) {
  statusEl.textContent = text;
  if (isError) {
    statusEl.style.color = 'var(--accent)';
  }
}

async function runHealthCheck() {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    setCheckStatus('health', true, `Status: ${data.status}`);
    return true;
  } catch (err) {
    setCheckStatus('health', false, err.message);
    return false;
  }
}

async function runDbCheck() {
  try {
    const res = await fetch('/api/deploy/check-db');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const ok = data.dbConnected;
    setCheckStatus(
      'db',
      ok,
      ok ? `Connected to ${data.database}@${data.host}` : 'Connection failed',
    );
    return ok;
  } catch (err) {
    setCheckStatus('db', false, err.message);
    return false;
  }
}

async function runRedisCheck() {
  try {
    const res = await fetch('/api/deploy/check-redis');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const ok = data.redisConnected;
    setCheckStatus(
      'redis',
      ok,
      ok
        ? `Ping responded (cache TTL: ${data.cacheTtlSeconds}s)`
        : 'Ping failed',
    );
    return ok;
  } catch (err) {
    setCheckStatus('redis', false, err.message);
    return false;
  }
}

async function runEnvCheck() {
  try {
    const res = await fetch('/api/deploy/env');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    setCheckStatus('env', true, 'Info loaded');
    // Populate the info table
    infoBody.innerHTML = '';
    for (const [key, value] of Object.entries(data)) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td class="info-key">${key}</td><td class="info-value">${value}</td>`;
      infoBody.appendChild(tr);
    }
    return true;
  } catch (err) {
    setCheckStatus('env', false, err.message);
    return false;
  }
}

async function runAll() {
  const healthOk = await runHealthCheck();
  const dbOk = await runDbCheck();
  const redisOk = await runRedisCheck();
  const envOk = await runEnvCheck();

  const allOk = healthOk && dbOk && redisOk && envOk;
  if (allOk) {
    setOverallStatus('✅ All deployment checks passed!');
  } else {
    const failed = [];
    if (!healthOk) failed.push('Health');
    if (!dbOk) failed.push('PostgreSQL');
    if (!redisOk) failed.push('Redis');
    if (!envOk) failed.push('Environment');
    setOverallStatus(`❌ Some checks failed: ${failed.join(', ')}`, true);
  }
}

runAll();
