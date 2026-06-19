import { Router } from "express";
import { getDashBoardData } from "../controllers/analytics.controller.js";
import { requestLogger } from "../middlewares/requestLogger.middleware.js";
import { logRequestID } from "../middlewares/logRequestID.middleware.js";

const router = Router();

router
  .route("/analytics/:shortCode")
  .get(logRequestID, requestLogger, getDashBoardData);

export default router;
