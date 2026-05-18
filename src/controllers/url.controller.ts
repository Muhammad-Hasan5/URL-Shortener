import type { Request, Response } from "express";
import { generateShortCode } from "../utils/shortCode.utils.js";
import { saveToDB, getFromDB } from "../repositories/url.repository.js";
import { query } from "../db/queries.db.js";
import {
  setToCache,
  getFromCache,
  incClickCount,
  updateTTL,
  ttl,
} from "../repositories/cache.repository.js";
import logger from "../config/pino-logging/index.pino.js";
import { cacheRequests } from "../config/prometheus-metrics/index.prometheus.js";
import { getTTL, shouldRefresh } from "../utils/cacheTTL.utils.js";
import env from "../config/env.js";

// covnert long url to SHORT one
export const shortURL = async (req: Request, res: Response) => {
  const { longURL, expires_at } = req.body;

  //validate long url
  try {
    new URL(longURL);
  } catch {
    return res.status(400).json({
      status: 400,
      success: false,
      msg: "invalid url",
    });
  }

  // save into db
  let attempts = 0;

  while (attempts < 3) {
    try {
      // call service to short url
      const result = generateShortCode();

      // checking if already in cache or not, escaping duplication
      const cacheResult = await getFromCache(result.shortCode);

      if (!cacheResult) {
        /* cache hit-miss counter */
        cacheRequests.inc({ result: "miss", cache_method: "get" });

        //logging cache-miss
        logger.info(
          {
            id: req.id,
            request_method: "POST",
            cache_method: "GET",
            route: "url-shortener-route",
          },
          "short-a-url.cache_missed",
        );

        logger.info({ chechPoint_DB: "checking if shortcode already in DB" });

        // checking if already in DB or not
        const existing = await query(
          `SELECT short_code FROM urls WHERE long_url = $1`,
          [longURL],
        );

        logger.info({ chechPoint_DB: "fetched results from DB" });

        if ((existing?.rows.length as number) > 0) {
          return res.status(200).json({
            success: true,
            shortURL: `${env.data?.BASE_URL}:${env.data?.PORT}/${existing?.rows[0].short_code}`,
          });
        }
      } else {
        /* cache hit-miss counter */
        cacheRequests.inc({ result: "hit", cache_method: "get" });

        //logging cache-hit
        logger.info(
          {
            id: req.id,
            request_method: "POST",
            cache_method: "GET",
            cache_result: cacheResult,
            route: "url-shortener-route",
          },
          "short-a-url.cache_hit",
        );

        //refreshing ttl if near to expire
        const remainingTtl = await ttl(cacheResult.shortCode);

        if (shouldRefresh(Number(remainingTtl), cacheResult.cachedTtl)) {
          const freshTtl = getTTL(
            cacheResult.clickCount,
            new Date(cacheResult.createdAt),
          );
          await updateTTL(cacheResult.shortCode, freshTtl);
        }

        return res.status(200).json({
          success: true,
          data: cacheResult,
        });
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

      return res.status(201).json({
        status: 201,
        success: true,
        msg: "long url is shortened and saved in DB",
        shortURL: `${baseURL}/${result.shortCode}`,
      });
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
};

// REDIRECT to long url
export const redirect = async (req: Request, res: Response) => {
  const shortCode = req.params.shortCode;

  //validate param: short code
  if (!shortCode) {
    return res.status(400).json({
      status: 400,
      success: false,
      msg: "short code is not available",
    });
  }

  // check cache to get redirect long url
  const cacheResult = await getFromCache(`url:${String(shortCode)}`);

  if (!cacheResult) {
    /* cache hit-miss counter */
    cacheRequests.inc({ result: "miss", cache_method: "get" });

    //logging cache-miss
    logger.info(
      {
        id: req.id,
        request_method: "REDIRECT",
        cache_method: "GET",
        route: "redirect-to-longURL-route",
      },
      "redirect-to-longURL.cache_missed",
    );

    // call db to get redirect long url
    const result = await getFromDB(shortCode as string);

    //validate DB results
    if (result?.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        success: false,
        msg: "url not exist in DB",
      });
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
    return res.redirect(302, result!.rows[0].long_url);
  } else {
    /* cache hit-miss counter */
    cacheRequests.inc({ result: "hit", cache_method: "get" });

    //logging cache-hit
    logger.info(
      {
        id: req.id,
        request_method: "REDIRECT",
        cache_method: "GET",
        cache_result: cacheResult,
        route: "redirect-to-longURL-route",
      },
      "redirect-to-longURL.cache_hit",
    );

    // incrementing click count
    await incClickCount(shortCode as string);

    //refreshing ttl if near to expire
    const remainingTtl = await ttl(cacheResult.shortCode);

    if (shouldRefresh(Number(remainingTtl), cacheResult.cachedTtl)) {
      const freshTtl = getTTL(
        cacheResult.clickCount,
        new Date(cacheResult.createdAt),
      );
      await updateTTL(cacheResult.shortCode, freshTtl);
    }

    return res.redirect(302, cacheResult);
  }
};
