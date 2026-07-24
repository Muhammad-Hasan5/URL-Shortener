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

/**
 * @swagger
 * /shorten:
 *   post:
 *     tags: [URL]
 *     summary: Shorten a long URL
 *     security:
 *       - accessTokenCookie: []
 *     description: >
 *       
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [longURL]
 *             properties:
 *               longURL:
 *                 type: string
 *                 example: https://example.com/very/long/path
 *     responses:
 *       '200':
 *         description: This long URL was already shortened for this user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   oneOf:
 *                     - type: string
 *                       description: Cache-hit shape - the full shortened URL.
 *                       example: https://url.ly/aZ3xQ1
 *                     - $ref: '#/components/schemas/UrlRecord'
 *                 msg:
 *                   type: string
 *                   example: this url was already shorten
 *       '201':
 *         description: URL shortened successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ShortenSuccessData'
 *                 msg:
 *                   type: string
 *                   example: url has been shorten successfully
 *       '400':
 *         description: Invalid or missing long URL, or the server was unable to resolve it
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 msg:
 *                   type: string
 *                   example: invalid url
 */
router
  .route("/shorten")
  .post(limiter, verifyJWT, logRequestID, requestLogger, shortURL);

//public route => for url redirect

/**
 * @swagger
 * /r/{shortCode}:
 *   get:
 *     tags: [URL]
 *     summary: Redirect to the original URL
 *     description: Public route (no auth required). On success, issues a 302 redirect with no JSON body, and enqueues an async click-tracking job.
 *     parameters:
 *       - in: path
 *         name: shortCode
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '302':
 *         description: Redirect to the original long URL
 *       '400':
 *         description: Short code missing, or not found for this URL/user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 msg:
 *                   type: string
 *                   example: short code is not available
 */
router
  .route("/r/:shortCode")
  .get(limiter, logRequestID, requestLogger, redirect);

/**
 * @swagger
 * /urls-list:
 *   post:
 *     tags: [URL]
 *     summary: List URLs for the authenticated user
 *     security:
 *       - accessTokenCookie: []
 *     description: >
 *       List URLs for the authenticated user
 *     responses:
 *       '200':
 *         description: URLs retrieved (data is null if the user has none)
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       nullable: true
 *                       items:
 *                         $ref: '#/components/schemas/UrlListItem'
 *       '404':
 *         description: Unable to fetch the user's URLs from the database
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router
  .route("/urls-list")
  .get(limiter, verifyJWT, logRequestID, requestLogger, getUrlsList);

/**
 * @swagger
 * /del-url/{shortCode}:
 *   post:
 *     tags: [URL]
 *     summary: Delete a shortened URL
 *     security:
 *       - accessTokenCookie: []
 *     description: >
 *       Delete a shortened URL
 *     parameters:
 *       - in: path
 *         name: shortCode
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: URL deleted successfully (also returned if the short code did not exist)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       '500':
 *         description: Server error while deleting the URL
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 500
 *                 data:
 *                   type: string
 *                   example: error deleting records form db
 *                 msg:
 *                   type: string
 *                   nullable: true
 */
router
  .route("/del-url/:shortCode")
  .delete(limiter, verifyJWT, logRequestID, requestLogger, deleteUrl);

export default router;
