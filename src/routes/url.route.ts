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
  .route("/shorten")
  .post(limiter, verifyJWT, logRequestID, requestLogger, shortURL);

//public route => for url redirect
router
  .route("/r/:shortCode")
  .get(limiter, logRequestID, requestLogger, redirect);
router
  .route("/urls-list")
  .post(limiter, verifyJWT, logRequestID, requestLogger, getUrlsList);
router
  .route("/del-url/:shortCode")
  .post(limiter, verifyJWT, logRequestID, requestLogger, deleteUrl);

export default router;
