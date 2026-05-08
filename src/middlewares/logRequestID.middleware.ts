import type { NextFunction, Request, Response } from "express";
import logger from "../config/pino-logging/index.pino.js";


export function logRequestID(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  req.id = req.headers["x-request-id"] ?? crypto.randomUUID();
  res.setHeader("X-Request-Id", req.id);
  req.log = logger.child({ requestId: req.id });
  next();
}
