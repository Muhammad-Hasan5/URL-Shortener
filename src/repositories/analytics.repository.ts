import { getPool } from "../db/pools.db.js";
import redis from "../config/redis/index.redis.js";

const db = getPool("read");

function parseZSetWithScores(flat: any) {
  const out = [];
  for (let i = 0; i < flat.length; i += 2) {
    out.push({ key: flat[i], count: Number(flat[i + 1]) });
  }
  return out;
}

export async function getLiveStats(shortCode: string) {
  const pipeline = redis.pipeline();

  pipeline.get(`stats:${shortCode}:total`);
  pipeline.get(`stats:${shortCode}:human`);
  pipeline.zrevrange(`stats:${shortCode}:countries`, 0, 4, "WITHSCORES");
  pipeline.zrevrange(`stats:${shortCode}:refTypes`, 0, -1, "WITHSCORES");

  // Build the last 24 hourly bucket keys, oldest to newest
  const now = Date.now();
  const hourKeys = [];
  for (let i = 23; i >= 0; i--) {
    const label = new Date(now - i * 3600_000).toISOString().slice(0, 13);
    hourKeys.push(`stats:${shortCode}:hour:${label}`);
  }
  hourKeys.forEach((key) => pipeline.get(key));

  const results = await pipeline.exec(); // each entry is [err, value]

  if (!results) {
    return null;
  }

  const totalClicks = Number(results[0]![1]) || 0;
  const humanClicks = Number(results[1]![1]) || 0;
  const topCountries = parseZSetWithScores(results[2]![1] || []);
  const referrerTypes = parseZSetWithScores(results[3]![1] || []);
  const last24hHourly = results.slice(4).map((r) => Number(r[1]) || 0);
  const last24hTotal = last24hHourly.reduce((sum, n) => sum + n, 0);

  return {
    totalClicks,
    humanClicks,
    topCountries,
    referrerTypes,
    last24hHourly,
    last24hTotal,
  };
}

export async function getTotalClicksForRange(
  urlId: string,
  startDate: Date,
  endDate: Date,
) {
  const { rows } = await db.query(
    `SELECT COALESCE(SUM(total_clicks), 0) AS total
     FROM url_click_daily
     WHERE url_id = $1 AND date >= $2 AND date < $3`,
    [urlId, startDate, endDate],
  );
  return Number(rows[0].total);
}

export async function getClicksOverTime(urlId: string, days: number) {
  const { rows } = await db.query(
    `SELECT date,
            SUM(total_clicks)  AS total_clicks,
            SUM(unique_clicks) AS unique_clicks
     FROM url_clicks_daily
     WHERE url_id = $1 AND date >= CURRENT_DATE - $2::interval
     GROUP BY date
     ORDER BY date ASC`,
    [urlId, `${days} days`],
  );
  return rows.map((r) => ({
    date: r.date,
    totalClicks: Number(r.total_clicks),
    uniqueClicks: Number(r.unique_clicks),
  }));
}

const ALLOWED_BREAKDOWN_COLUMNS = [
  "country_code",
  "device_type",
  "referrer_type",
  "browser_name",
];

export async function getBreakdownBy(
  column: string,
  urlId: string,
  days: number,
  limit = 10,
) {
  if (!ALLOWED_BREAKDOWN_COLUMNS.includes(column)) {
    throw new Error(`Invalid breakdown column: ${column}`);
  }

  const { rows } = await db.query(
    `SELECT ${column} AS key, SUM(total_clicks) AS clicks
     FROM url_clicks_daily
     WHERE url_id = $1
       AND date >= CURRENT_DATE - $2::interval
       AND ${column} IS NOT NULL
     GROUP BY ${column}
     ORDER BY clicks DESC
     LIMIT $3`,
    [urlId, `${days} days`, limit],
  );
  return rows.map((r) => ({ key: r.key, clicks: Number(r.clicks) }));
}

export async function getRecentClicks(urlId: string, limit = 20) {
  const { rows } = await db.query(
    `SELECT clicked_at, country_name, city, device_type, browser_name, referrer_type
     FROM url_clicks
     WHERE url_id = $1 AND is_bot = false
     ORDER BY clicked_at DESC
     LIMIT $2`,
    [urlId, limit],
  );
  return rows;
}
