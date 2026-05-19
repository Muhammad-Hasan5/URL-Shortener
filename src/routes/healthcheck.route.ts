import { Router } from "express";
import { apiMetrics, serverHealthCheck, serverReadyCheck } from "../controllers/healthcheck.controller.js";

const router = Router()

router.route("/health/live").get(serverHealthCheck);
router.route("/health/ready").get(serverReadyCheck);
router.route("/metrics").get(apiMetrics)

export default router