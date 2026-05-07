process.loadEnvFile();
import { rateLimit } from "express-rate-limit";
import redis from "../config/redis/index.redis.js";
import { RedisStore } from "rate-limit-redis";
const windowMs = Number(process.env.RATE_LIMIT_WINDOWSMS);
const maxReq = Number(process.env.RATE_LIMIT_MAX_REQUESTS);
const limiter = rateLimit({
    windowMs,
    limit: maxReq,
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
        sendCommand: (command, ...args) => redis.call(command, ...args),
    }),
});
export default limiter;
//# sourceMappingURL=rateLimit.js.map