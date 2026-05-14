import type { Request, Response } from "express";
import { generateShortCode } from "../services/shortCode.service.js";
import { saveToDB, getFromDB } from "../repositories/url.repository.js";
import { query } from "../db/queries.db.js";
import { setToCache, getFromCache } from "../services/cache.service.js";
import logger from "../config/pino-logging/index.pino.js";
import {
  cacheRequests,
  requestDuration,
} from "../config/prometheus-metrics/index.prometheus.js";
import env from "../config/env.js";

// covnert long url to SHORT one
export const shortURL = async (req: Request, res: Response) => {
  //start request timer metric
  const end = requestDuration.startTimer({
    method: "POST",
    route: "url-shortener-route",
  });

  const { longURL } = req.body;

  //validate long url
  try {
    new URL(longURL);
  } catch {
    //request end-time
    const endtime = end({ status: "failed-400" });

    //logging
    logger.error(
      {
        id: req.id,
        success: false,
        statusCode: 400,
        msg: "invalid longURL",
        user_longURL: longURL,
        latencyMS: Date.now() - endtime,
      },
      "short-a-url.unsuccessful",
    );

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
      logger.info({ checkPoint_code_generator: "starting to generate code" });

      // call service to short url
      const result = generateShortCode();

      logger.info({
        checkPoint_code_generator: "short code generated",
        shortcode: result,
      });

      logger.info({ checkPoint_cache: "starting getting from cache" });

      // checking if already in cache or not
      const cacheResult = await getFromCache(`url:${result.shortCode}`);

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
          //request end-time
          const endtime = end({ status: "success-200" });

          //logging
          logger.info(
            {
              id: req.id,
              success: true,
              statusCode: 200,
              long_url: longURL,
              shortCode: existing?.rows[0].short_code,
              msg: "longURL already shorted previously",
              latencyMS: Date.now() - endtime,
            },
            "short-a-url.already_shorten.successful",
          );

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

        return res.status(200).json({
          success: true,
          shortURL: cacheResult,
        });
      }

      logger.info({ checkPoint_DB: "starting saving to database" });

      //inserting into DB
      await saveToDB({
        id: result.id.toString(),
        shortCode: result.shortCode,
        longURL,
      });

      logger.info({ checkPoint_DB: "saved to database" });

      logger.info({ checkPoint_cache: "starting saving to cache" });

      //save new record to cache
      setToCache({ shortCode: result.shortCode, longURL });

      logger.info({ checkPoint_cache: "saved to cache (maybe)" });

      //response
      const baseURL = `${env.data?.BASE_URL}:${env.data?.PORT}`;

      //request end-time
      const endtime = end({ status: "success-201" });

      //logging
      logger.info(
        {
          id: req.id,
          success: true,
          statusCode: 201,
          long_url: longURL,
          shortCode: result.shortCode,
          mag: "longURL shorten successfully",
          latencyMS: Date.now() - endtime,
        },
        "short-a-url.shorten-successful",
      );

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

      //request end-time
      const endtime = end({ status: "failed-400" });

      //logging
      logger.error(
        {
          id: req.id,
          success: false,
          statusCode: 400,
          long_url: longURL,
          mag: "request failed",
          latencyMS: Date.now() - endtime,
        },
        "short-a-url.shorten-unsuccessful.request-failed",
      );
    }
  }
};

// REDIRECT to long url
export const redirect = async (req: Request, res: Response) => {
  // starting request time
  const end = requestDuration.startTimer({
    method: "REDIRECT",
    route: "redirect-to-longURL-route",
  });

  const { shortCode } = req.params;

  //validate param: short code
  if (!shortCode) {
    //request end-time
    const endtime = end({ status: "failed-400" });

    //logging
    logger.error(
      {
        id: req.id,
        success: false,
        statusCode: 400,
        msg: "invalid short code",
        latencyMS: Date.now() - endtime,
      },
      "redirect-to-longURL.unsuccessful",
    );

    return res.status(400).json({
      status: 400,
      success: false,
      msg: "short code is not available",
    });
  }

  logger.info({ checkPoint_cache: "starting getting from cache" });

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

    logger.info({ checkPoint_DB: "starting fetching long url from DB" });

    // call db to get redirect long url
    const result = await getFromDB(shortCode as string);

    logger.info({ checkPoint_DB: "fetched results from DB" });

    //validate DB results
    if (result?.rows.length === 0) {
      //request end-time
      const endtime = end({ status: "failed-404" });

      //logging
      logger.error(
        {
          id: req.id,
          success: false,
          statusCode: 404,
          db_result: result,
          msg: "url not exists in DB",
          latencyMS: Date.now() - endtime,
        },
        "redirect-to-longURL.unsuccessful",
      );

      return res.status(404).json({
        status: 404,
        success: false,
        msg: "url not exist in DB",
      });
    }

    logger.info({ checkPoint_cache: "starting to save to cache" });

    //save to cache
    setToCache({
      shortCode: `url:${String(shortCode)}`,
      longURL: result!.rows[0].long_url,
    });

    logger.info({
      checkPoint_cache: "maybe saved to cache as it is a silent operation",
    });

    //request end-time
    const endtime = end({ status: "successful-302" });

    //logging
    logger.info(
      {
        id: req.id,
        success: true,
        statusCode: 302,
        msg: "redirect successful",
        latencyMS: Date.now() - endtime,
      },
      "redirect-to-longURL.successful",
    );

    // redirect
    return res.redirect(302, result!.rows[0].long_url);
  } else {
    /* cache hit-miss counter */
    cacheRequests.inc({ result: "hit", cache_method: "get" });

    //logging cache-miss
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

    return res.redirect(302, cacheResult);
  }
};
