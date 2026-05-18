import type { NextFunction, Request, Response } from "express";
import logger from "../config/pino-logging/index.pino.js";
import { requestDuration } from "../config/prometheus-metrics/index.prometheus.js";

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on("finish", () => {
    const durationMS = Date.now() - start;
    logger.info(
      {
        method: req.method,
        route: req.route?.path ?? req.path,
        statusCode: res.statusCode,
        durationMS,
        requestId: req.id,
      },
      "http.request",
    );

    requestDuration
      .labels(req.method, req.route?.path ?? req.path, String(res.statusCode))
      .observe(durationMS);
  });

  next();
}
