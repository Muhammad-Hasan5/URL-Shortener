import { generateShortCode } from "../utils/url-utils/shortCode.utils.js";
import { saveToDB, getFromDB } from "../repositories/url.repository.js";
import { query } from "../db/queries.db.js";
import { set, get, incr } from "../repositories/cache.repository.js";
import logger from "../config/pino-logging/index.pino.js";
import { getTTL, refreshTtl } from "../utils/cache-utils/cacheTTL.utils.js";
import env from "../config/env.js";
import {
  cacheHitLog,
  cacheMissLog,
} from "../utils/cache-utils/cacheLogs.utils.js";
import type { QueryResult } from "pg";
import type { CacheRecord } from "../@types/cache/index.types.js";

// perfix builder for cache keys(observe the beauty of it mannnnnn!!)
const keys = {
  url: (shortCode: string) => `url:${shortCode}`,
  clicks: (shortCode: string) => `url:clicks:${shortCode}`,
};

type ServiceResponse = {
  status: number;
  data: QueryResult<any> | CacheRecord | string;
};

export async function resolveLongUrl(
  requestId: any,
  longURL: string,
): Promise<ServiceResponse | null> {
  let attempts: number = 0;

  while (attempts < 3) {
    try {
      const result = generateShortCode();
      const cacheKey = keys.url(result.shortCode);

      // checking if already in cache or not, escaping duplication
      const cacheResult = await get(cacheKey);

      if (!cacheResult) {
        //cache logging
        cacheMissLog({
          reqId: requestId,
          reqMethod: "POST",
          cacheMethod: "GET",
          route: "short-a-url",
        });

        // checking if already in DB or not
        const existing = await query(`SELECT * FROM urls WHERE long_url = $1`, [
          longURL,
        ]);

        if ((existing?.rows.length as number) > 0) {
          return {
            status: 200,
            data: existing!,
          };
        }

        //inserting into DB
        await saveToDB({
          id: result.id.toString(),
          shortCode: result.shortCode,
          longURL,
        });

        const now = new Date();

        const TTL = getTTL(0, now);

        //save new record to cache
        await set({
          shortCode: cacheKey,
          longURL,
          clickCount: 0,
          createdAt: now.toISOString(),
          expiresAt: null,
          lastAccessedAt: null,
          cachedTtl: TTL,
        });

        //response
        const baseURL = `${env.BASE_URL}${env.PORT}`;

        return {
          status: 201,
          data: `${baseURL}/${result.shortCode}`,
        };
      }
      
      // cache hit logging
      cacheHitLog({
        reqId: requestId,
        reqMethod: "POST",
        cacheMethod: "GET",
        cacheResult,
        route: "short-a-url",
      });

      attempts++;
    } catch (error: any) {
      logger.error({ error, attempts }, "resolveLongURL.service.failed");

      if (error.code === "23505") {
        attempts++;
        continue;
      }

      throw error;
    }
  }

  logger.error({ requestId, longURL }, "resolveLongUrl.maxAttemptsExceeded");
  return null;
}

export async function resolveShortCode(
  requestId: any,
  shortCode: string,
): Promise<ServiceResponse | null> {
  const cacheKey = keys.url(shortCode);
  const clicksKey = keys.clicks(shortCode);

  try {
    // check cache to get redirect long url
    const cacheResult = await get(cacheKey);

    if (!cacheResult) {
      //cache miss logging
      cacheMissLog({
        reqId: requestId,
        reqMethod: "REDIRECT",
        cacheMethod: "GET",
        route: "redirect-to-long-url",
      });

      // call db to get redirect long url
      const result = await getFromDB(shortCode as string);

      //validate DB results
      if (!result || result?.rows.length === 0) {
        return null;
      }

      const { click_count, created_at, long_url } = result.rows[0];
      const TTL = getTTL(Number(click_count), new Date(created_at));

      const now = new Date();

      //save to cache
      await set({
        shortCode: `url:${String(shortCode)}`,
        longURL: long_url,
        clickCount: click_count,
        createdAt: created_at,
        expiresAt: null,
        lastAccessedAt: now.toISOString(),
        cachedTtl: TTL,
      });

      await incr(clicksKey);

      // redirect
      return { status: 302, data: long_url };
    }
    //cache hit logging
    cacheHitLog({
      reqId: requestId,
      reqMethod: "REDIRECT",
      cacheMethod: "GET",
      cacheResult,
      route: "redirect-to-long-url",
    });

    // incrementing click count
    await incr(clicksKey);

    //refreshing ttl if near to expire
    await refreshTtl(cacheResult);

    return {
      status: 302,
      data: cacheResult.longURL,
    };
  } catch (error: any) {
    logger.error({ err: error }, "resolveShortCode.service.failed");
    return null;
  }
}
