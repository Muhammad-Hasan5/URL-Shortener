process.loadEnvFile();
import { Redis } from "ioredis";
// creating redis client
let redis;
if (process.env.ENV === "DEVELOPMENT") {
    redis = new Redis(); //local
}
else {
    redis = new Redis(process.env.REDIS_URL); //upstash => cloud
}
redis.on("connect", () => console.log("REDIS CONNECTED"));
redis.on("error", () => console.log("REDIS ERROR"));
export default redis;
//# sourceMappingURL=index.redis.js.map