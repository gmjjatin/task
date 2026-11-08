const TTL_MS = 60 * 1000;

export function createProductCache(now) {
  const entries = new Map();
  return {
    get(key) {
      const entry = entries.get(key);
      if (!entry || entry.expiresAt <= now()) return undefined;
      return entry.value;
    },
    set(key, value) {
      entries.set(key, { value, expiresAt: now() + TTL_MS });
    },
    clear() {
      entries.clear();
    },
  };
}
