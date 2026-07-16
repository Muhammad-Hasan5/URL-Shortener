import app from "./app.js";
import { primaryPool, replicaPool } from "./db/pools.db.js";
import redis from "./config/redis/index.redis.js";
import logger from "./observability/pino-logging/index.pino.js";
import env from "./config/env.js";
import { SnowflakeGenerator } from "./utils/snowflakeID-utils/snowflakeID.utils.js";
import { claimMachineID } from "./utils/snowflakeID-utils/machineIdLease.utils.js";
import { analyticsQueue } from "./analytics/analytics.queue.js";
import { analyticsWorker } from "./analytics/analytics.worker.js";
import { aggregationQueue } from "./analytics/aggregation/queue.aggregation.js";
import { aggregationWorker } from "./analytics/aggregation/scheduler.aggregation.js";

const { machineId, stopRenewal } = await claimMachineID(redis);
console.log(machineId);
export const snowflake = new SnowflakeGenerator(machineId);

const server = app.listen(env.PORT, async () => {
  logger.info(`App is running on port http://localhost:${env.PORT}`);
});

process.on("SIGTERM", async (): Promise<any> => {
  logger.info("closing system");

  // stopping renewal of machineID
  stopRenewal();
  // releasing all machineIds in redis
  await redis.del(`snowflake:machine:${machineId}`);

  server.close(async () => {
    await Promise.all([
      primaryPool.end(),
      replicaPool.end(),
      analyticsWorker.close(),
      aggregationWorker.close(),
      analyticsQueue.close(),
      aggregationQueue.close(),
      redis.quit(),
    ]);
    process.exit(0);
  });
});
