import { Router } from "express";
import {
  apiMetrics,
  serverHealthCheck,
  serverReadyCheck,
} from "../controllers/healthcheck.controller.js";

const router = Router();

/**
 * @swagger
 * /health/live:
 *   get:
 *     tags: [Health]
 *     summary: Check whether the service is alive
 *     responses:
 *       '200':
 *         description: Service is healthy and live
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthLiveResponse'
 */
router.route("/health/live").get(serverHealthCheck);

/**
 * @swagger
 * /health/ready:
 *   get:
 *     tags: [Health]
 *     summary: Check whether the service and its dependencies (Postgres, Redis) are ready
 *     description: Returns "degraded" (still HTTP 200) when the DB is up but Redis is not ready.
 *     responses:
 *       '200':
 *         description: Service is ready, or degraded (cache down but DB up)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthReadyResponse'
 *       '503':
 *         description: Service is not ready (database down)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthReadyResponse'
 */
router.route("/health/ready").get(serverReadyCheck);

/**
 * @swagger
 * /metrics:
 *   get:
 *     tags: [Health]
 *     summary: Get Prometheus metrics
 *     responses:
 *       '200':
 *         description: Metrics payload in Prometheus text exposition format
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: |
 *                 # HELP http_requests_total Total number of HTTP requests
 *                 # TYPE http_requests_total counter
 *                 http_requests_total{method="GET",status="200"} 1027
 */
router.route("/metrics").get(apiMetrics);

export default router;
