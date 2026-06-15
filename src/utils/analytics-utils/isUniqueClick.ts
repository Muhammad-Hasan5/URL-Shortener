import { safeRedis } from "../../config/opossum-circuit-Breaker/redisBreaker.opossum.js";
import redis from "../../config/redis/index.redis.js";

export const isUniqueClick = async (
  url_id: string,
  haship: string,
  date: Date,
): Promise<boolean> => {
  const key = `unique:${url_id}:${date.toISOString().slice(0, 10)}`;
  const added = await safeRedis(async () => {
    return await redis.sadd(key, haship);
  });
  await safeRedis(async () => await redis.expire(key, 172800));
  return added === 1;
};
