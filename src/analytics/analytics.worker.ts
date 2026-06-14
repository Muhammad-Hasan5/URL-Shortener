import { clickCountScheduler } from "./analytics.queue.js";
import { Worker } from "bullmq";
import logger from "../config/pino-logging/index.pino.js";
import { flushClickCount } from "./analytics.service.js";
import redis from "../config/redis/index.redis.js";

const FLUSH_INTERVAL_MS = 60_000;

await clickCountScheduler.upsertJobScheduler(
  "click-count-flush",
  {
    every: FLUSH_INTERVAL_MS,
  },
  {
    name: "click-count-flush",
    data: { msg: "click count flusher runs" },
    opts: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 1000,
      },
      removeOnComplete: 10,
      removeOnFail: true,
    },
  },
);

export const worker = new Worker(
  "click-count-scheduler",
  async (job) => {
    logger.info(`Processing job ${job.id}, with a message: ${job.data.msg}`);
    await flushClickCount();
  },
  { connection: redis, concurrency: 1 },
);
