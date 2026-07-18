import redis from "../config/redis/index.redis.js";
import { safeRedis } from "../config/opossum-circuit-Breaker/redisBreaker.opossum.js";
import type { CacheRecord } from "../@types/cache/index.types.js";

// prefix for key (no trailing colon here; we'll add it when building keys)
const SETGET_PREFIX = "url";

// saving to cache
export async function set(cacheRecord: CacheRecord): Promise<void> {
  const key = `${SETGET_PREFIX}:${cacheRecord.shortCode}:${cacheRecord.user_id}`;
  await safeRedis(async () =>
    await redis.set(key, JSON.stringify(cacheRecord), "EX", cacheRecord.cachedTtl),
  );
}

// getting from cache (expects the full redis key)
export async function get(key: string): Promise<CacheRecord | null> {
  const res = await safeRedis(async () => await redis.get(key));
  if (!res) return null;
  return JSON.parse(res);
}

// Get TTL for a cache entry by shortCode and userId
export async function getKeyTTL(shortCode: string, userId: string): Promise<number | null> {
  const key = `${SETGET_PREFIX}:${shortCode}:${userId}`;
  return await safeRedis(async () => await redis.ttl(key));
}

// Update TTL for a cache entry by shortCode and userId
export async function updateKeyTTL(
  shortCode: string,
  userId: string,
  newTTL: number,
): Promise<void> {
  const key = `${SETGET_PREFIX}:${shortCode}:${userId}`;
  await safeRedis(async () => await redis.expire(key, newTTL));
}

// Cache mapping from shortCode + user to url id. TTL set to 10 minutes.
export async function setUrlId(id: string, shortCode: string, userId: string) {
  const key = `${SETGET_PREFIX}:id:${shortCode}:${userId}`;
  await safeRedis(async () => {
    await redis.set(key, id, "EX", 600);
  });
}

export async function getUrlID(key: string): Promise<string | null> {
  const res = await safeRedis(async () => await redis.get(key));
  if (!res) return null;
  return res;
}

export async function setAllUrlsOfUser(
  userId: string,
  urls: { urls: any[] },
) {
  await safeRedis(async () => {
    await redis.set(`All:urls:${userId}`, JSON.stringify(urls), "EX", 600);
  });
}

export async function getAllUrlsOfUser(key: string) {
  const res = await safeRedis(async () => await redis.get(key));
  if (!res) return null;
  return JSON.parse(res);
}

export async function deleteAllUrlsOfUser(key: string) {
  await safeRedis(async () => {
    await redis.del(key);
  });
}