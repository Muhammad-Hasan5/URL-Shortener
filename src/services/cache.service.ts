import redis from "../config/redis.js";

const PREFIX = "url:"

export function setToCache(shortCode: string, longURL: string) {
    try {
        redis.set(PREFIX + shortCode, longURL, "EX", 60 * 60 * 24)
    } catch (error: any) {
        console.log("error saving to cache", error);
    }
}

export async function getFromCache(shortCode: string) {
    try {
        const res = await redis.get(PREFIX + shortCode)
        return res
    } catch (error: any) {
        console.log("Error fetching from cache", error);
        return null
    }
}