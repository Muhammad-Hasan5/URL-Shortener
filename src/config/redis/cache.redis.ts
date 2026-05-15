import logger from "../pino-logging/index.pino.js";
import redis from "./index.redis.js";
import type { CacheRecordType } from "../../@types/cache/index.types.js";

// prefix for key
const PREFIX = "url:";

// saving to cache
export function set(cacheRecord: CacheRecordType): void {
  try {
    redis.set(
      PREFIX + cacheRecord.shortCode,
      cacheRecord.longURL,
      "EX",
      60 * 60 * 24,
    );
  } catch (error: any) {
    logger.error("error saving to cache", error);
  }
}

// getting from cache
export async function get(shortCode: string): Promise<string | null> {
  try {
    const res = await redis.get(PREFIX + shortCode);
    return res;
  } catch (error: any) {
    logger.error("Error fetching from cache", error);
    return null;
  }
}

export async function incr(shortCode: string): Promise<void> {
  await redis.incr(`urls:click:${shortCode}`, (err: any, newValue: number | undefined) => {
    if (err) {
      logger.error(`error incrementing for ${shortCode}`, err);
    } else {
      logger.info(`increment successful ${newValue}`);
    }
  });
}
