import { rateLimit, type RateLimitRequestHandler } from "express-rate-limit";
import redis from "../config/redis/index.redis.js";
import { RedisStore, type RedisReply } from "rate-limit-redis";
import env from "../config/env.js";

const windowMs = env.RATE_LIMIT_WINDOWSMS as number
const maxReq = env.RATE_LIMIT_MAX_REQUESTS as number


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
