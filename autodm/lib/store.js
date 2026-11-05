// Armazenamento: Upstash Redis (REST) quando configurado; senão, memória
// (útil para testes locais — na Vercel sem Redis os dados não persistem).

const REDIS_URL = () => process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = () => process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

const memory = { kv: new Map(), lists: new Map() };

export function hasRedis() {
  return Boolean(REDIS_URL() && REDIS_TOKEN());
}

async function redis(command) {
  const res = await fetch(REDIS_URL(), {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  });
  const data = await res.json();
  if (data.error) throw new Error(`Redis: ${data.error}`);
  return data.result;
}

export async function get(key) {
  if (!hasRedis()) return memory.kv.get(key) ?? null;
  return redis(['GET', key]);
}

export async function set(key, value, { ttlSeconds, onlyIfNew } = {}) {
  if (!hasRedis()) {
    if (onlyIfNew && memory.kv.has(key)) return false;
    memory.kv.set(key, value);
    return true;
  }
  const cmd = ['SET', key, value];
  if (onlyIfNew) cmd.push('NX');
  if (ttlSeconds) cmd.push('EX', String(ttlSeconds));
  return (await redis(cmd)) === 'OK';
}

export async function pushLog(key, value, max = 500) {
  if (!hasRedis()) {
    const list = memory.lists.get(key) ?? [];
    list.unshift(value);
    memory.lists.set(key, list.slice(0, max));
    return;
  }
  await redis(['LPUSH', key, value]);
  await redis(['LTRIM', key, '0', String(max - 1)]);
}

export async function readLog(key, count = 100) {
  if (!hasRedis()) return (memory.lists.get(key) ?? []).slice(0, count);
  return (await redis(['LRANGE', key, '0', String(count - 1)])) ?? [];
}

// ---------- Helpers de domínio ----------

export async function getRules() {
  const raw = await get('rules');
  return raw ? JSON.parse(raw) : [];
}

export async function saveRules(rules) {
  await set('rules', JSON.stringify(rules));
}

export async function logEvent(event) {
  await pushLog('events', JSON.stringify({ at: new Date().toISOString(), ...event }));
}

export async function getEvents(count) {
  return (await readLog('events', count)).map((e) => JSON.parse(e));
}

/** Retorna true só na primeira vez que um id é visto (evita processar webhook repetido). */
export async function markProcessed(id) {
  return set(`seen:${id}`, '1', { ttlSeconds: 60 * 60 * 24 * 8, onlyIfNew: true });
}

export async function getAccessToken() {
  return (await get('ig_token')) || process.env.IG_ACCESS_TOKEN;
}

export async function saveAccessToken(token) {
  await set('ig_token', token);
}

export function _resetMemory() {
  memory.kv.clear();
  memory.lists.clear();
}
