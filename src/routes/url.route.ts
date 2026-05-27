import { Router } from "express";
import { shortURL, redirect } from "../controllers/url.controller.js";
import limiter from "../middlewares/rateLimit.middleware.js";
import { requestLogger } from "../middlewares/requestLogger.middleware.js";
import { logRequestID } from "../middlewares/logRequestID.middleware.js";

const router = Router();

router.route("/shorten").post(limiter, logRequestID, requestLogger, shortURL);
router
  .route("/r/:shortCode")
  .get(logRequestID, requestLogger, redirect);

export default router;
