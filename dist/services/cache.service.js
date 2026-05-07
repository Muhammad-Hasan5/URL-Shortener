import { setBreaker, getBreaker, } from "../config/opossum/cacheCircuitBreaker.js";
import {} from "../config/redis/cache.redis.js";
// saving to cache
export function setToCache(cacheRecord) {
    setBreaker.fire(cacheRecord).catch((err) => {
        console.log("Cache set failed:", err.message);
    });
}
// getting from cache
export async function getFromCache(shortCode) {
    try {
        return await getBreaker.fire(shortCode);
    }
    catch (error) {
        console.log("Error fetching from cache", error);
        return null;
    }
}
//# sourceMappingURL=cache.service.js.map