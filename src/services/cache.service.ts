import {
  setBreaker,
  getBreaker,
} from "../config/opossum/cacheCircuitBreaker.js";
import {
  type cacheRecordType,
  type shortCodeType,
} from "../config/redis/cache.redis.js";


// saving to cache
export function setToCache(cacheRecord: cacheRecordType): void {
  setBreaker.fire(cacheRecord).catch((err: any) => {
    console.log("Cache set failed:", err.message);
  });
}


// getting from cache
export async function getFromCache(shortCode: shortCodeType): Promise<any> {
  try {
    return await getBreaker.fire(shortCode);
  } catch (error: any) {
    console.log("Error fetching from cache", error);
    return null;
  }
}
