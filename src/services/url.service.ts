import { generateShortCode } from "../utils/url-utils/shortCode.utils.js";
import {
  checkIfAlreadyExists,
  createUrl,
  findByShortCode,
  getUrlIdFromDb,
} from "../repositories/url.repository.js";
import {
  set,
  get,
  setUrlId,
  getUrlID,
} from "../repositories/cache.repository.js";
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
  url_id: (shortCode: string) => `url:${shortCode}:id`,
};

type ServiceResponse = {
  status: number;
  url_id?: string;
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
        const existing = await checkIfAlreadyExists(longURL);

        if (existing && (existing?.rows.length as number) > 0) {
          return {
            status: 200,
            data: existing,
          };
        }

        //inserting into DB
        await createUrl({
          id: result.id.toString(),
          shortCode: result.shortCode,
          longURL,
        });

        const now = new Date();

        const TTL = getTTL(0, now);

        //save new record to cache
        await set({
          id: result.id.toString(),
          shortCode: cacheKey,
          longURL,
          clickCount: 0,
          createdAt: now.toISOString(),
          expiresAt: null,
          lastAccessedAt: null,
          cachedTtl: TTL,
        });

        //response
        const baseURL = `http://localhost:${env.PORT}`;

        return {
          status: 201,
          url_id: result.id.toString(),
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

      const baseURL = `http://localhost${env.PORT}`;

      return {
        status: 200,
        url_id: cacheResult.id.toString(),
        data: `${baseURL}/${cacheResult.shortCode}`,
      };
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
      const result = await findByShortCode(shortCode as string);

      //validate DB results
      if (!result || result?.rows.length === 0) {
        return null;
      }

      const { id, click_count, created_at, long_url } = result.rows[0];
      const TTL = getTTL(Number(click_count), new Date(created_at));

      const now = new Date();

      //save to cache
      await set({
        id: id.toString(),
        shortCode: `url:${String(shortCode)}`,
        longURL: long_url,
        clickCount: click_count,
        createdAt: created_at,
        expiresAt: null,
        lastAccessedAt: now.toISOString(),
        cachedTtl: TTL,
      });

      // redirect
      return { status: 302, url_id: id.toString(), data: long_url };
    }
    //cache hit logging
    cacheHitLog({
      reqId: requestId,
      reqMethod: "REDIRECT",
      cacheMethod: "GET",
      cacheResult,
      route: "redirect-to-long-url",
    });

    //refreshing ttl if near to expire
    await refreshTtl(cacheResult);

    return {
      status: 302,
      url_id: cacheResult.id,
      data: cacheResult.longURL,
    };
  } catch (error: any) {
    logger.error({ err: error }, "resolveShortCode.service.failed");
    return null;
  }
}

//TODO: getShortURL_ID()
export const getUrlId = async (
  shortCode: string,
  requestId: any,
): Promise<ServiceResponse | null> => {
  const cacheKey = keys.url_id(shortCode);
  try {
    const cacheResult = await getUrlID(cacheKey);

    if (!cacheResult) {
      //cache miss logging
      cacheMissLog({
        reqId: requestId,
        reqMethod: "GET",
        cacheMethod: "GET",
        route: "fetch-shortCode-id",
      });

      const res = await getUrlIdFromDb(shortCode);
      if (!res || res.rows.length == 0) {
        return null;
      }

      const { id } = res.rows[0];

      await setUrlId(id, shortCode); //cache

      return {
        status: 200,
        data: id,
      };
    }

    cacheHitLog({
      reqId: requestId,
      reqMethod: "GET",
      cacheMethod: "GET",
      route: "fetch-shortUrl-id",
    });

    return {
      status: 200,
      data: cacheResult,
    };
  } catch (error: any) {
    logger.error({ err: error }, "resolveShortCode.service.failed");
    return null;
  }
};
