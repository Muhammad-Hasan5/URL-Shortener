import redis from "../config/redis/index.redis.js";
import { clickCountScheduler } from "../config/bullmq/index.bullmq.js";
import logger from "../config/pino-logging/index.pino.js";
import { safeRedis } from "../config/opossum-circuit-Breaker/redisBreaker.opossum.js";
import { getPool } from "../db/pools.db.js";
import { Worker } from "bullmq";

const FLUSH_INTERVAL_MS = 60_000;
const KEY_PATTERN = "url:clicks:*";

async function flushClickCount(): Promise<void> {
  // timer: how much time to flush => for logging
  const start = Date.now();

  //fetched all the keys of matching pattern
  const keys = await safeRedis(async () => await redis.keys(KEY_PATTERN));

  // if no keys found => no flush
  if (!keys || keys?.length == 0) {
    logger.info(
      "clickFlush.job: no keys of such pattern are there || no keys are there",
    );
    return;
  }

  //creating a redis pipeline to fetch and delete th values
  const pipeline = redis.pipeline();

  for (const key of keys) {
    pipeline.getdel(key); // atomically fetched and deleted
  }

  //executing all the commands in pipeline
  const results = await safeRedis(async () => await pipeline.exec());

  if (!results) {
    logger.error(
      "clickFlush.job: pipeline.exec returned null — Redis error, counts lost for this cycle",
    );
    return;
  }

  const updates: { shortCode: string; delta: number }[] = [];

  /*building a bulk payload to update DB */
  for (let i = 0; i < keys.length; i++) {
    const shortCode = keys[i]?.replace("url:clicks:", "");
    const [pipelineErr, value] = results[i] as [Error | null, string | null];

    if (pipelineErr) {
      logger.error(
        { err: pipelineErr, shortCode },
        "clickFlush.job: getdel failed for key",
      );
      continue;
    }

    const delta = parseInt(value ?? "", 10);

    if (!isNaN(delta) && delta > 0) {
      updates.push({ shortCode: shortCode!, delta });
    }
  }

  if (updates.length == 0) {
    logger.debug("clickFlush.job: all deltas were zero or invalid");
    return;
  }

  //separating shortCodes and deltas
  const shortCodes = updates.map((u) => u.shortCode);
  const deltas = updates.map((u) => u.delta);

  // querying DB for updation
  const db = getPool("write");
  await db.query(
    `
        UPDATE urls
        SET click_count = click_count + delta_table.delta
        FROM UNNEST($1::TEXT[], $2::INT[]) AS delta_table(short_code, delta)
        WHERE urls.short_code = delta_table.short_code
    `,
    [shortCodes, deltas],
  );

  logger.info(
    {
      flushedKeys: updates.length,
      totalClicks: deltas.reduce((a, b) => a + b, 0),
      durationMs: Date.now() - start,
    },
    "clickFlush.job.complete",
  );
}

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
