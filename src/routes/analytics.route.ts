import { Router } from "express";
import { getDashBoardData } from "../controllers/analytics.controller.js";
import { requestLogger } from "../middlewares/requestLogger.middleware.js";
import { logRequestID } from "../middlewares/logRequestID.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import limiter from "../middlewares/rateLimit.middleware.js";

const router = Router();

router
  .route("api/v1/analytics/:shortCode")
  .get(limiter, verifyJWT, logRequestID, requestLogger, getDashBoardData);

export default router;
