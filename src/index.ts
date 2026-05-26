import app from "./app.js";
import { PgPool } from "./db/pool.db.js";
import redis from "./config/redis/index.redis.js";
import logger from "./config/pino-logging/index.pino.js";
import env from "./config/env.js";
import { startFlushingClicks } from "./jobs/clickFlush.job.js";

async function start() {
  try {
    await redis.connect()
  } catch (err: any) {
    logger.warn({ err }, "redis.startup.failed — running without cache");
  }

  const server = app.listen(env.data?.PORT, async () => {
    logger.info(
      `App is running on port ${env.data?.BASE_URL}:${env.data?.PORT}`,
    );

    // running flush for click count form redis to PG
    startFlushingClicks();
  });

  process.on("SIGTERM", async (): Promise<any> => {
    logger.info("closing system");

    server.close(async () => {
      await PgPool.end();
      await redis.quit();
      process.exit(0);
    });
  });
}

start()
