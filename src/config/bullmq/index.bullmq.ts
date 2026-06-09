import redis from "../redis/index.redis.js";
import { Queue } from "bullmq";

export const clickCountScheduler = new Queue("click-count-scheduler", {
  connection: redis,
});
