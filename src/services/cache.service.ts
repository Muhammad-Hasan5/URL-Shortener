import {
  setBreaker,
  getBreaker,
  incBreaker,
  getKeyTTLBreaker,
  updateKeyTTLBreaker,
} from "../config/opossum-circuit-Breaker/cacheCircuitBreaker.opossum.js";
import logger from "../config/pino-logging/index.pino.js";
import { type CacheRecordType } from "../@types/cache/index.types.js";

// saving to cache
export async function setToCache(cacheRecord: CacheRecordType): Promise<void> {
  await setBreaker.fire(cacheRecord).catch((err: any) => {
    logger.error("breaker failed: Cache set failed:", err.message);
  });
}

// getting from cache
export async function getFromCache(shortCode: string): Promise<any> {
  return await getBreaker.fire(shortCode).catch((err: any) => {
    logger.error("breaker failed: Error fetching from cache", err);
    return null;
  });
}

export async function incClickCount(shortCode: string): Promise<void> {
  await incBreaker.fire(shortCode).catch((err: any) => {
    logger.error("breaker failed: failed to increase the click count", err);
  });
}

export async function ttl(shortCode: string): Promise<any> {
  return await getKeyTTLBreaker.fire(shortCode).catch((err: any) => {
    logger.error("breaker failed: failed to fetch the TTL", err);
  });
}

export async function updateTTL(
  shortCode: string,
  newTTL: number,
): Promise<void> {
  await updateKeyTTLBreaker.fire(shortCode, newTTL).catch((err: any) => {
    logger.error("breaker failed: failed to update the TTL", err);
  });
}
