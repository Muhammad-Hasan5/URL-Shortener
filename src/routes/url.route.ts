import { Router } from "express";
import {
  shortURL,
  redirect,
  getUrlsList,
  deleteUrl,
} from "../controllers/url.controller.js";
import limiter from "../middlewares/rateLimit.middleware.js";
import { requestLogger } from "../middlewares/requestLogger.middleware.js";
import { logRequestID } from "../middlewares/logRequestID.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router
  .route("api/v1/shorten")
  .post(limiter, verifyJWT, logRequestID, requestLogger, shortURL);
router
  .route("api/v1/r/:shortCode")
  .get(limiter, verifyJWT, logRequestID, requestLogger, redirect);
router
  .route("api/v1/urls-list/:shortCode")
  .post(limiter, verifyJWT, logRequestID, requestLogger, getUrlsList);
router
  .route("api/v1/del-url/:shortCode")
  .post(limiter, verifyJWT, logRequestID, requestLogger, deleteUrl);

export default router;
