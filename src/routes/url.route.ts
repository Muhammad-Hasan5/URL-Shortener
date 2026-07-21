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
  .post(verifyJWT, limiter, logRequestID, requestLogger, shortURL);

//public route => for url redirect
router
  .route("/r/:shortCode")
  .get(logRequestID, requestLogger, redirect);
router
  .route("/urls-list")
  .get(verifyJWT, limiter, logRequestID, requestLogger, getUrlsList)
  .post(verifyJWT, limiter, logRequestID, requestLogger, getUrlsList);
router
  .route("/del-url/:shortCode")
  .delete(verifyJWT, limiter, logRequestID, requestLogger, deleteUrl)
  .post(verifyJWT, limiter, logRequestID, requestLogger, deleteUrl);

export default router;
