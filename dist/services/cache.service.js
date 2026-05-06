import redis from "../config/redis.js";
// prefix for key
const PREFIX = "url:";
// saving to cache
export function setToCache(cacheRecord) {
    try {
        redis.set(PREFIX + cacheRecord.shortCode, cacheRecord.longURL, "EX", 60 * 60 * 24);
    }
    catch (error) {
        console.log("error saving to cache", error);
    }
}
// getting from cache
export async function getFromCache(shortCode) {
    try {
        const res = await redis.get(PREFIX + shortCode);
        return res;
    }
    catch (error) {
        console.log("Error fetching from cache", error);
        return null;
    }
}
//# sourceMappingURL=cache.service.js.map