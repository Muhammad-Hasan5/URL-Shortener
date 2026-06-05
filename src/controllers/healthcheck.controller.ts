import type { Request, Response } from "express";
import logger from "../config/pino-logging/index.pino.js";
import redis from "../config/redis/index.redis.js";
import { checkPoolReady } from "../db/pools.db.js";
import register from "../config/prometheus-metrics/index.prometheus.js";

export async function serverHealthCheck(req: Request, res: Response) {
  return res.status(200).json({
    message: "Server is healthy and live.",
  });
}

export async function serverReadyCheck(req: Request, res: Response) {
  const dbStatus = await checkPoolReady();

  if (dbStatus == true && redis.status === "ready") {
    logger.info({
      status: "ready",
      database: "up",
      cache: "up",
    });

    return res.status(200).json({
      status: "ready",
      database: "up",
      cache: "up",
    });
  } else if (dbStatus == true && redis.status !== "ready") {
    logger.info({
      status: "degraded",
      database: "up",
      cache: "down",
    });

    return res.status(200).json({
      status: "degraded",
      database: "up",
      cache: "down",
    });
  } else {
    logger.info({
      status: "not_ready",
      database: "down",
      cache: "up/down",
    });

    return res.status(503).json({
      status: "not_ready",
      database: "down",
      cache: "up/down",
    });
  }
}

export async function apiMetrics(req: Request, res: Response) {
  res.set("Content-Type", register.contentType);
  return res.send(await register.metrics());
}
