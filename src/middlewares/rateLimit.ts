process.loadEnvFile();

import { rateLimit, type RateLimitRequestHandler } from "express-rate-limit";
import redis from "../config/redis/index.redis.js";
import { RedisStore, type RedisReply } from "rate-limit-redis";

const windowMs = Number(process.env.RATE_LIMIT_WINDOWSMS);
const maxReq = Number(process.env.RATE_LIMIT_MAX_REQUESTS);

/* express-rate-limt => sliding window algo */

const limiter: RateLimitRequestHandler = rateLimit({
  windowMs,
  limit: maxReq,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (command: string, ...args: string[]) =>
      redis.call(command, ...args) as Promise<RedisReply>,
  }),
});

export default limiter;
