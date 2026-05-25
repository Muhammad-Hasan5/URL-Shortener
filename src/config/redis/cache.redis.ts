import logger from "../pino-logging/index.pino.js";
import redis from "./index.redis.js";
import type { CacheRecordType } from "../../@types/cache/index.types.js";

// prefix for key 
const SETGET_PREFIX = "url:";
const INCR_PREFIX = "url:clicks:";

//TODO convert key value to hash set in redis

// saving to cache
export async function set(cacheRecord: CacheRecordType): Promise<void> {
  try {
    await redis.set(
      SETGET_PREFIX + cacheRecord.shortCode,
      JSON.stringify(cacheRecord),
      "EX",
      cacheRecord.cachedTtl,
    );
  } catch (error: any) {
    logger.error("error saving to cache", error);
  }
}

// getting from cache
export async function get(shortCode: string): Promise<any> {
  try {
    const res = await redis.get(SETGET_PREFIX + shortCode);
    return JSON.parse(res!);
  } catch (error: any) {
    logger.error("Error fetching from cache", error);
    return null;
  }
}

// icrementing click count
export async function incr(shortCode: string): Promise<void> {
  await redis.incr(
    `${INCR_PREFIX}${shortCode}`,
    (err: any, newValue: number | undefined) => {
      if (err) {
        logger.error(`error incrementing for ${shortCode}`, err);
      } else {
        logger.info(`increment successful ${newValue}`);
      }
    },
  );
}

export async function getKeyTTL(shortCode: string) {
  try {
    return await redis.ttl(SETGET_PREFIX + shortCode);
  } catch (error: any) {
    logger.error({error}, 'redis.getKeyTTL.failed')
  }
}

export async function updateKeyTTL(shortCode: string, newTTL: number){
  try {
    await redis.expire(SETGET_PREFIX + shortCode, newTTL);
  } catch (error: any) {
    logger.error({ error }, "redis.updateKeyTTL.failed");
  }
}
