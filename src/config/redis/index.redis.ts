import { Redis } from "ioredis";
import logger from "../pino-logging/index.pino.js";
import env from "../env.js";

// creating redis client

//TODO solve the graceful redis failure

let redis: Redis;

redis = new Redis(env.data?.REDIS_URL!, {
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
}); 

logger.info("redis client created successfully");

redis.on("connect", () => logger.info("REDIS CONNECTED"));
redis.on("error", () => logger.error("REDIS ERROR"));
redis.on("close", () => logger.info("Redis connection closed"));
redis.on("reconnecting", () => logger.info("Redis reconnecting..."));

export default redis;
