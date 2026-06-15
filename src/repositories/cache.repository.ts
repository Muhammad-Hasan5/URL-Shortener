import redis from "../config/redis/index.redis.js";
import { safeRedis } from "../config/opossum-circuit-Breaker/redisBreaker.opossum.js";
import type { CacheRecord } from "../@types/cache/index.types.js";

// prefix for key
const SETGET_PREFIX = "url:";

// saving to cache
export async function set(cacheRecord: CacheRecord): Promise<void> {
  await safeRedis(
    async () =>
      await redis.set(
        SETGET_PREFIX + cacheRecord.shortCode,
        JSON.stringify(cacheRecord),
        "EX",
        cacheRecord.cachedTtl,
      ),
  );
}

// getting from cache
export async function get(shortCode: string): Promise<CacheRecord | null> {
  const res = await safeRedis(
    async () => await redis.get(SETGET_PREFIX + shortCode),
  );
  if (!res) return null;
  return JSON.parse(res);
}

export async function getKeyTTL(shortCode: string): Promise<number | null> {
  return await safeRedis(() => redis.ttl(SETGET_PREFIX + shortCode));
}

export async function updateKeyTTL(
  shortCode: string,
  newTTL: number,
): Promise<void> {
  await safeRedis(
    async () => await redis.expire(SETGET_PREFIX + shortCode, newTTL),
  );
}
