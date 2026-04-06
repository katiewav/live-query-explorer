const DEFAULT_TTL = 8 * 60 * 1000; // 8 minutes

// ── In-memory fallback ──
const memCache = new Map<string, { data: unknown; expires: number }>();

function hasVercelKV(): boolean {
  return !!(process.env.KV_URL || process.env.KV_REST_API_URL);
}

async function kvFetch(
  method: "GET" | "SET",
  key: string,
  value?: unknown,
  ttlSeconds?: number
): Promise<unknown> {
  const base = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!base || !token) return null;

  if (method === "GET") {
    const res = await fetch(`${base}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.result ? JSON.parse(json.result as string) : null;
  }

  // SET with EX
  const args = [`/set/${encodeURIComponent(key)}/${encodeURIComponent(JSON.stringify(value))}`];
  if (ttlSeconds) args[0] += `/EX/${ttlSeconds}`;
  const res = await fetch(`${base}${args[0]}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.ok;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (hasVercelKV()) {
    const val = await kvFetch("GET", key);
    return (val as T) ?? null;
  }
  const entry = memCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    memCache.delete(key);
    return null;
  }
  return entry.data as T;
}

export async function cacheSet<T>(
  key: string,
  data: T,
  ttlMs: number = DEFAULT_TTL
): Promise<void> {
  if (hasVercelKV()) {
    await kvFetch("SET", key, data, Math.floor(ttlMs / 1000));
    return;
  }
  memCache.set(key, { data, expires: Date.now() + ttlMs });
}
