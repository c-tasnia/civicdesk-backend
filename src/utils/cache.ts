import { redis } from "../lib/redis";

const DEFAULT_TTL_SECONDS = 300; // 5 minutes

/**
 * Read-through cache: returns the cached value if present, otherwise calls
 * `loader`, caches the result, and returns it. Falls through to `loader`
 * untouched if Redis isn't configured or is unreachable — caching is an
 * optimization, never a hard dependency.
 */
export const getOrSetCache = async <T>(
  key: string,
  loader: () => Promise<T>,
  ttlSeconds = DEFAULT_TTL_SECONDS
): Promise<T> => {
  if (!redis) return loader();

  try {
    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached) as T;
  } catch (err) {
    console.error(`Cache read failed for key "${key}":`, err);
  }

  const fresh = await loader();

  try {
    await redis.set(key, JSON.stringify(fresh), "EX", ttlSeconds);
  } catch (err) {
    console.error(`Cache write failed for key "${key}":`, err);
  }

  return fresh;
};

/** Deletes every key matching a prefix — used to bust cache on writes. */
export const invalidateCacheByPrefix = async (prefix: string): Promise<void> => {
  if (!redis) return;

  try {
    const keys = await redis.keys(`${prefix}*`);
    if (keys.length) await redis.del(...keys);
  } catch (err) {
    console.error(`Cache invalidation failed for prefix "${prefix}":`, err);
  }
};
