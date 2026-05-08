import {
  setBreaker,
  getBreaker,
} from "../config/opossum-circuit-Breaker/cacheCircuitBreaker.opossum.js";
import logger from "../config/pino-logging/index.pino.js";
import { type CacheRecordType } from "../@types/cache/index.types.js";


// saving to cache
export function setToCache(cacheRecord: CacheRecordType): void {
  setBreaker.fire(cacheRecord).catch((err: any) => {
    logger.error("Cache set failed:", err.message);
  });
}


// getting from cache
export async function getFromCache(shortCode: string): Promise<any> {
  try {
    return await getBreaker.fire(shortCode);
  } catch (error: any) {
    logger.error("Error fetching from cache", error);
    return null;
  }
}
