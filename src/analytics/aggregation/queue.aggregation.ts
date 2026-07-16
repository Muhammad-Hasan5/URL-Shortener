import { bullConnection } from "../../config/redis/index.redis.js";
import { Queue } from "bullmq";

export const aggregationQueue = new Queue("aggregation", {
  connection: bullConnection,
});
