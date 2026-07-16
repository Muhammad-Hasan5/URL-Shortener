import { bullConnection } from "../config/redis/index.redis.js";
import { Queue } from "bullmq";

export const analyticsQueue = new Queue("click", {
  connection: bullConnection,
});
