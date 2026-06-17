import { aggregationQueue } from "./queue.aggregation.js";
import { aggregateRecentClicks } from "../analytics.service.js";
import { Worker } from "bullmq";
import logger from "../../config/pino-logging/index.pino.js";
import redis from "../../config/redis/index.redis.js";

await aggregationQueue.upsertJobScheduler(
  "aggregation",
  {
    every: 60000,
  },
  {
    name: "aggregation-job",
    data: { msg: "aggregation done" },
    opts: {
      attempts: 3,
      backoff: { type: "exponential", delay: 1000 },
      removeOnComplete: 50,
      removeOnFail: 100,
    },
  },
);

// Worker to process the jobs
export const aggregationWorker = new Worker(
  "aggregation",
  async (job) => {
    logger.info(`Processing job ${job.id}`);
    await aggregateRecentClicks();
    logger.info(`Completed job ${job.id} with msg: ${job.data.jobData}`);
  },
  { connection: redis },
);
