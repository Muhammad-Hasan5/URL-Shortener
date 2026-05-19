import { generateShortCode } from "../utils/url-utils/shortCode.utils.js";
import { saveToDB, getFromDB } from "../repositories/url.repository.js";
import { query } from "../db/queries.db.js";
import {
  setToCache,
  getFromCache,
  incClickCount,
} from "../repositories/cache.repository.js";
import logger from "../config/pino-logging/index.pino.js";
import { getTTL, refreshTtl } from "../utils/cache-utils/cacheTTL.utils.js";
import env from "../config/env.js";
import { cacheHitLog, cacheMissLog } from "../utils/cache-utils/cacheLogs.utils.js";

type ReturnType = {
  status: number;
  data: any;
};

export async function resolveLongUrl(
  requestId: any,
  longURL: string,
  expires_at: Date,
): Promise<ReturnType | null> {
  let attempts: number = 0;

  while (attempts < 3) {
    try {
      const result = generateShortCode();

      // checking if already in cache or not, escaping duplication
      const cacheResult = await getFromCache(result.shortCode);

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
            data: existing,
          };
        }

        //TODO add auth
        //const date = new Date()
        //const expiryDate = date.setDate(date.getDate() + 1)

        //inserting into DB
        await saveToDB({
          id: result.id.toString(),
          shortCode: result.shortCode,
          longURL,
          expires_at: new Date(expires_at),
        });

        const TTL = getTTL(0, new Date(Date.now()));

        //save new record to cache
        await setToCache({
          shortCode: result.shortCode,
          longURL,
          clickCount: 0,
          createdAt: new Date(Date.now()).toISOString(),
          expiresAt: new Date(expires_at).toISOString(),
          cachedTtl: TTL,
        });

        //response
        const baseURL = `${env.data?.BASE_URL}:${env.data?.PORT}`;

        return {
          status: 201,
          data: `${baseURL}/${result.shortCode}`,
        };

        //`${env.data?.BASE_URL}:${env.data?.PORT}/${existing?.rows[0].short_code}`}
      }
      // cache hit logging
      cacheHitLog({
        reqId: requestId,
        reqMethod: "POST",
        cacheMethod: "GET",
        cacheResult,
        route: "short-a-url",
      });

      await refreshTtl(cacheResult);

      return {
        status: 200,
        data: cacheResult,
      };
    } catch (error: any) {
      logger.error(
        { error, attempts },
        "Error creating shortcode and saving to DB",
      );

      if (error.code === "23505") {
        attempts++;
        continue;
      }
    }
  }

  return null;
}

export async function resolveShortCode(
  requestId: any,
  shortCode: string,
): Promise<ReturnType | null> {
  try {
    // check cache to get redirect long url
    const cacheResult = await getFromCache(`url:${String(shortCode)}`);

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
      if (result?.rows.length === 0) {
        return null;
      }

      const clickCount = result?.rows[0].click_count;
      const created_at = result?.rows[0].created_at;
      const TTL = getTTL(Number(clickCount), new Date(created_at));

      //save to cache
      await setToCache({
        shortCode: `url:${String(shortCode)}`,
        longURL: result?.rows[0].long_url,
        clickCount,
        createdAt: created_at,
        expiresAt: result?.rows[0].expires_at,
        cachedTtl: TTL,
      });

      // redirect
      return { status: 302, data: result!.rows[0].long_url };
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
    await incClickCount(shortCode as string);

    //refreshing ttl if near to expire
    await refreshTtl(cacheResult);

    return {
      status: 302,
      data: cacheResult.longURL,
    };
  } catch (error: any) {
    logger.error("error fetching the respective long url to redirect", error);
    return null;
  }
}
