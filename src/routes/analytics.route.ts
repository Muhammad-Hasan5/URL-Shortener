import { Router } from "express";
import { getDashBoardData } from "../controllers/analytics.controller.js";
import { requestLogger } from "../middlewares/requestLogger.middleware.js";
import { logRequestID } from "../middlewares/logRequestID.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import limiter from "../middlewares/rateLimit.middleware.js";

const router = Router();

/**
 * @swagger
 * /analytics/{shortCode}:
 *   get:
 *     tags: [Analytics]
 *     summary: Get a 30-day analytics dashboard for a shortened URL
 *     security:
 *       - accessTokenCookie: []
 *     description: returns the overall analytics of a short url
 *     parameters:
 *       - in: path
 *         name: shortCode
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: >
 *           Analytics data returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/AnalyticsData'
 *                 msg:
 *                   type: string
 *                   example: analytics fetched
 *       '400':
 *         description: Short code missing from the URL path
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 400
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 msg:
 *                   type: string
 *                   example: short code is not available
 *       '404':
 *         description: Short URL not found, deleted, or does not belong to this user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 404
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 msg:
 *                   type: string
 *                   example: short url is not available or got deleted
 *       '500':
 *         description: internal server error, fetching URL
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 500
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 msg:
 *                   type: string
 *                   example: error fetching data from database
 *      
 */
router
  .route("/analytics/:shortCode")
  .get(limiter, verifyJWT, logRequestID, requestLogger, getDashBoardData);

export default router;
