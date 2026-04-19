import redis from "../config/redis.js";
const PREFIX = "url:";
export async function setToCache(shortCode, longURL) {
    try {
        await redis.set(PREFIX + shortCode, longURL, "EX", 60 * 60 * 24);
    }
    catch (error) {
        console.log("error saving to cache", error);
    }
}
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