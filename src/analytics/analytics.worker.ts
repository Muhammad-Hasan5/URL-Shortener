import { Worker } from "bullmq";
import { bullConnection } from "../config/redis/index.redis.js";
import { parseReferrer } from "./parsers/referrer.parsers.js";
import { getLocation } from "./parsers/geo.parsers.js";
import { parseDevice } from "./parsers/device.parsers.js";
import {
  incr_click_counts,
  insert_into_url_clicks,
} from "./analytics.service.js";

//ananlytics worker
export const analyticsWorker = new Worker(
  "click",
  async (job) => {
    const { short_code, url_id, userId, ip, userAgent, referrer, clicked_at } =
      job.data;

    const [device, location, source] = await Promise.all([
      parseDevice(userAgent),
      getLocation(ip),
      parseReferrer(referrer),
    ]);

    const isBot = device?.isBot ?? false;

    await Promise.all([
      insert_into_url_clicks({
        ip,
        url_id,
        userId,
        short_code,
        clicked_at,
        country_code: location.countryCode,
        country_name: location.countryName,
        city: location.city,
        region: location.region,
        latitude: location.latitude,
        longitude: location.longitude,
        timezone: location.timezone,
        device_type: device?.deviceType,
        os_name: device?.OSName,
        browser_name: device?.browserName,
        browser_version: device?.browserVersion,
        is_bot: isBot,
        referrer_url: source.referrerURL,
        referrer_domain: source.domain,
        referrer_type: source.type,
        referrer_name: source.name,
      }),
      incr_click_counts(short_code, location.countryCode, isBot, source.type),
    ]);
  },
  {
    connection: bullConnection,
    concurrency: 20,
  },
);
