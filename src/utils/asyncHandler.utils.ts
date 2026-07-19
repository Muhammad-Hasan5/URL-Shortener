import type { Request, Response, NextFunction } from "express";
import logger from "../observability/pino-logging/index.pino.js";

export const asyncHandler =
  (fn: (req: Request, res: Response) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    fn(req, res).catch((error: any) => {
      logger.error("unhandled error in auth controller", error);
      if (!res.headersSent) {
        res.status(500).json({
          status: 500,
          data: null,
          msg: "internal server error",
        });
      } else {
        next(error);
      }
    });
  };
