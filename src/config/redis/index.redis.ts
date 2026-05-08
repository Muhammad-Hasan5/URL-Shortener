import { Redis } from "ioredis";
import logger from "../pino-logging/index.pino.js";
import env from "../env.js";

// creating redis client

let redis: Redis;

if (env.data?.ENV === "DEVELOPMENT") {
  redis = new Redis({
    host: "localhost",
    port: 6379,
    lazyConnect: true,
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
    retryStrategy(times) {
      if (times > 2) {
        logger.info("Local Redis unavailable");
        return null;
      }
      return 100;
    },
  }); //local
} else {
  redis = new Redis(env.data?.REDIS_URL as string, {
    lazyConnect: true,
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
    retryStrategy(times) {
      if (times > 3) {
        logger.info("Redis unavailable. Continuing without cache");
        return null;
      }
      return Math.min(times * 200, 2000);
    },
  }); //upstash => cloud
}

logger.info("redis client created successfully");

redis.on("connect", () => logger.info("REDIS CONNECTED"));
redis.on("error", () => logger.error("REDIS ERROR"));
redis.on("close", () => logger.info("Redis connection closed"));
redis.on("reconnecting", () => logger.info("Redis reconnecting..."));

export default redis;
