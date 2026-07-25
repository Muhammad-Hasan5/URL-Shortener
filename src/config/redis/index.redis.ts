import { Redis } from "ioredis";
import logger from "../../observability/pino-logging/index.pino.js";
import env from "../env.js";

const redisUrl =
  env.NODE_ENV === "production" ? env.REDIS_UPSTASH_URL : env.REDIS_URL;

const redis = new Redis(redisUrl, {
  retryStrategy(times) {
    const delay = Math.min(times * 300, 5000);
    logger.warn({ attempt: times, delayMs: delay }, "redis.retry");
    return delay;
  },
});

export const bullConnection = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
});

logger.info("redis client created successfully");

redis.on("error", (err) => logger.warn({ err }, "redis.error"));
redis.on("connect", () => logger.info("redis.connected"));
redis.on("ready", () => logger.info("redis.ready"));
redis.on("close", () => logger.warn("redis.disconnected"));

redis.on("end", () => {
  logger.error("redis.connection.ended — no more retries");
});

export default redis;
