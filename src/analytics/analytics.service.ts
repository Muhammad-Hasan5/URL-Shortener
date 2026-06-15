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
  logger.info("analytics:insert_into_url_clicks:succeeded")
};

export const incr_click_counts = async (
  shortCode: string,
  countryCode: string | undefined,
  isBot: boolean,
): Promise<void> => {
  await Promise.all([
    safeRedis(async () => await redis.incr(`clicks:total:${shortCode}`)),
    !isBot &&
      safeRedis(async () => await redis.incr(`clicks:human:${shortCode}`)),
    !isBot &&
      countryCode &&
      safeRedis(
        async () =>
          await redis.zincrby(`clicks:country:${shortCode}`, 1, countryCode),
      ),
  ]);
  logger.info("analytics:incr_click_counts:succeeded");
};
