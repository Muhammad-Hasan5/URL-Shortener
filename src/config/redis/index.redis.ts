import { Redis } from "ioredis";
import logger from "../pino-logging/index.pino.js";
import env from "../env.js";

// creating redis client

let redis: Redis;

redis = new Redis(env.data?.REDIS_URL!, {
  lazyConnect: true,
  enableOfflineQueue: false,
  maxRetriesPerRequest: 1,
  retryStrategy(times) {
    if (times > 3) {
      logger.info("Redis unavailable");
      return null;
    }
    return 100;
  },
}); 

logger.info("redis client created successfully");

redis.on("connect", () => logger.info("REDIS CONNECTED"));
redis.on("error", () => logger.warn("REDIS ERROR"));
redis.on("close", () => logger.warn("Redis connection closed"));

export default redis;
