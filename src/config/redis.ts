process.loadEnvFile();

import { Redis } from "ioredis";

const redis = new Redis(process.env.REDIS_URL as string);

redis.on("connect", () => console.log("REDIS CONNECTED"));
redis.on("error", () => console.log("REDIS ERROR"));

export default redis;
