import logger from "../config/pino-logging/index.pino.js";
import { getPool } from "../db/pools.db.js";
import { safeRedis } from "../config/opossum-circuit-Breaker/redisBreaker.opossum.js";
import redis from "../config/redis/index.redis.js";
import { haship } from "../utils/analytics-utils/haship.js";
import { isUniqueClick } from "../utils/analytics-utils/isUniqueClick.js";

const db = getPool("write");

export const insert_into_url_clicks = async (data: any) => {
  const date = new Date();
  const hash_ip = haship(data.ip, date);
  const is_unique = await isUniqueClick(data.url_id, hash_ip, date);
  await db.query(
    `Insert into url_clicks (
      url_id, 
      short_code, 
      clicked_at, 
      country_code,
      country_name,
      city,
      region,
      latitude,
      longitude,
      timezone,
      device_type,
      os_name,
      browser_name,
      browser_version,
      is_bot,
      referrer_url,
      referrer_domain,
      referrer_type,
      referrer_name,
      ip_hash,
      is_unique
      ) 
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9,
      $10, $11, $12, $13, $14, $15, $16, $17, $18, 
      $19, $20, $21)`,
    [
      data.url_id,
      data.short_code,
      data.clicked_at,
      data.country_code,
      data.country_name,
      data.city,
      data.region,
      data.latitude,
      data.longitude,
      data.timezone,
      data.device_type,
      data.os_name,
      data.browser_name,
      data.browser_version,
      data.is_bot,
      data.referrer_url,
      data.referrer_domain,
      data.referrer_type,
      data.referrer_name,
      hash_ip,
      is_unique,
    ],
  );
  logger.info("analytics:insert_into_url_clicks:succeeded");
};

export const incr_click_counts = async (
  shortCode: string,
  countryCode: string | undefined,
  isBot: boolean,
  referrerType: string,
): Promise<void> => {
  const p = redis.pipeline();
  p.incr(`stats:${shortCode}:total`);
  if (!isBot) {
    p.incr(`stats:${shortCode}:human`);
    if (countryCode) {
      p.zincrby(`stats:${shortCode}:countries`, 1, countryCode);
    }
    p.zincrby(`stats:${shortCode}:refTypes`, 1, referrerType);
    const hour = new Date().toISOString().slice(0, 13); 
    p.incr(`stats:${shortCode}:hour:${hour}`);
    p.expire(`stats:${shortCode}:hour:${hour}`, 172800); 
  }
  await safeRedis(async () => await p.exec());
  logger.info("analytics:incr_click_counts:succeeded");
};

export const aggregateRecentClicks = async () => {
  const oneMinAgo = new Date(Date.now() - 60_000);

  // Read raw clicks from the last 60 seconds
  const clicks = await db.query(
    `
    SELECT url_id, DATE(clicked_at) as date,
           country_code, device_type, referrer_type, browser_name,
           COUNT(*) as total,
           COUNT(*) FILTER (WHERE is_unique) as unique_c,
           COUNT(*) FILTER (WHERE is_bot)   as bots
    FROM   url_clicks
    WHERE  clicked_at >= $1
    GROUP  BY url_id, date, country_code, device_type, referrer_type, browser_name
  `,
    [oneMinAgo],
  );

  // Upsert into the aggregate table (CONFLICT = add to existing row)
  for (const row of clicks.rows) {
    await db.query(
      `
      INSERT INTO url_click_daily (url_id,date,country_code,device_type,
        referrer_type,browser_name,total_clicks,unique_clicks,bot_clicks)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      ON CONFLICT (url_id,date,country_code,device_type,referrer_type,browser_name)
      DO UPDATE SET
        total_clicks  = url_click_daily.total_clicks  + EXCLUDED.total_clicks,
        unique_clicks = url_click_daily.unique_clicks + EXCLUDED.unique_clicks,
        bot_clicks    = url_click_daily.bot_clicks    + EXCLUDED.bot_clicks
    `,
      [
        row.url_id,
        row.date,
        row.country_code,
        row.device_type,
        row.referrer_type,
        row.browser_name,
        row.total,
        row.unique_c,
        row.bots,
      ],
    );
  }
}