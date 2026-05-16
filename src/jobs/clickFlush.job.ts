import { query } from "../db/queries.db.js";
import redis from "../config/redis/index.redis.js";
import logger from "../config/pino-logging/index.pino.js";

const FLUSH_INTERVAL_MS = 60_000;
const KEY_PATTERN = "url:click:*";

async function flushClickCount(): Promise<void> {
  const start = Date.now(); // timer: how much time to flush

  //fetched all the keys of matching pattern
  const keys = await redis.keys(KEY_PATTERN);

  // if no keys found => no flush
  if (keys.length == 0) {
    logger.info("clickFlush.job: no keys of such pattern are there");
    return;
  }

  //creating a redis pipeline to fetch and delete th values
  const pipeline = redis.pipeline();

  for (const key of keys) {
    pipeline.getdel(key); // atomically fetched and deleted
  }

  //executing all the commands in pipeline
  const results = await pipeline.exec();

  const updates: { shortCode: string; delta: number }[] = [];

  /*building a bulk payload to update DB */
  for (let i = 0; i < keys.length; i++) {
    const shortCode = keys[i]?.replace("url:click:", "");
    const value = results?.[i]?.[1];
    const delta = parseInt(value as string, 10);

    if (!isNaN(delta) && delta > 0) {
      updates.push({ shortCode: shortCode!, delta });
    }
  }

  if (updates.length == 0) return;

  //separating shortCodes and deltas
  const shortCodes = updates.map((u) => u.shortCode);
  const deltas = updates.map((u) => u.delta);

  // querying DB for updation
  await query(
    `
        UPDATE urls
        SET click_count = click_count + delta_table.delta
        FROM UNNEST($1::STRING[], $2::INT[]) AS delta_table(short_code, delta)
        WHERE urls.short_code = delta_table.short_code
    `,
    [shortCodes, deltas],
  );

  logger.info(
    {
      flushedKeys: updates.length,
      totalClicks: deltas.reduce((a, b) => a + b, 0),
      durationMS: Date.now() - start,
    },
    "clickFlush.job.complete",
  );
}

// looping the flush
async function runFLushLoop(): Promise<void> {
  while (true) {
    try {
      await flushClickCount();
    } catch (error: any) {
      logger.error({ error }, "clickFlush.job.error");
    }

    await new Promise((resolve) => setTimeout(resolve, FLUSH_INTERVAL_MS));
  }
}

// method for index.ts
export async function startFlushingClicks(): Promise<void>{
    logger.info('clickFLush.job.starting')
    await runFLushLoop()
}
