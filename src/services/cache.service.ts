import redis from "../config/redis.js";

// new cache record type
type cacheRecordType = {
  shortCode: string;
  longURL: string;
};

// short code type
type shortCodeType = string;

// prefix for key
const PREFIX = "url:";

// saving to cache
export function setToCache(cacheRecord: cacheRecordType): void {
  try {
    redis.set(
      PREFIX + cacheRecord.shortCode,
      cacheRecord.longURL,
      "EX",
      60 * 60 * 24,
    );
  } catch (error: any) {
    console.log("error saving to cache", error);
  }
}

// getting from cache
export async function getFromCache(
  shortCode: shortCodeType,
): Promise<string | null> {
  try {
    const res = await redis.get(PREFIX + shortCode);
    return res;
  } catch (error: any) {
    console.log("Error fetching from cache", error);
    return null;
  }
}
