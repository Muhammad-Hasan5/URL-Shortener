import { Router } from "express";
import {
  apiMetrics,
  serverHealthCheck,
  serverReadyCheck,
} from "../controllers/healthcheck.controller.js";

const router = Router();

router.route("/api/v1/health/live").get(serverHealthCheck);
router.route("/api/v1/health/ready").get(serverReadyCheck);
router.route("/api/v1/metrics").get(apiMetrics);

export default router;
