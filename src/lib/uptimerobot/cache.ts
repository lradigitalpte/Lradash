interface CacheEntry<T> {
  value: T
  expiresAt: number
}

function getCacheMap() {
  const g = globalThis as any
  if (!g.__urCache) {
    g.__urCache = new Map<string, CacheEntry<any>>()
  }
  return g.__urCache as Map<string, CacheEntry<any>>
}

export function cacheGet<T>(key: string): T | null {
  const map = getCacheMap()
  const entry = map.get(key)
  if (!entry) {
    return null
  }
  if (Date.now() > entry.expiresAt) {
    map.delete(key)
    return null
  }
  return entry.value as T
}

export function cacheSet<T>(key: string, value: T, ttlMs: number) {
  const map = getCacheMap()
  map.set(key, { value, expiresAt: Date.now() + ttlMs })
}
