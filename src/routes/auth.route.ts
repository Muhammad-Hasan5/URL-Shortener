import { Router } from "express";
import {
  changePassword,
  deleteUser,
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  resendEmailVerification,
  resetForgotPassword,
  resetPasswordRequest,
  verifyEmail,
} from "../controllers/auth.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validate.middleware.js";
import {
  registerUserObject,
  loginSchemaObject,
  incomingPassword,
  incomingEmail,
  changePasswordObject,
  resetForgotPasswordObject,
} from "../@types/auth/index.types.js";

const router = Router();

// Public routes

/**
 * @swagger
 * /register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, email, password]
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: secret123!#$
 *     responses:
 *       '201':
 *         description: >
 *           User created successfully. 
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 201
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/UserObject'
 *                 msg:
 *                   type: string
 *                   nullable: true
 *                   example: null
 *       '400':
 *         description: Request validation failed (missing/invalid firstName, lastName, email, or password)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       '409':
 *         description: User already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/register", validateRequest(registerUserObject), registerUser);

/**
 * @swagger
 * /login:
 *   post:
 *     tags: [Auth]
 *     summary: Log in a user
 *     security: []
 *     description: >
 *       On success, sets `accessToken` and `refreshToken` as httpOnly cookies in addition to the JSON body.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: secret123!#$
 *     responses:
 *       '200':
 *         description: User logged in successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/UserObject'
 *                     msg:
 *                       type: string
 *                       example: user logged successfully
 *       '400':
 *         description: Request validation failed, or email is not yet verified
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/ValidationErrorResponse'
 *                 - $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '403':
 *         description: Account is inactive, or temporarily locked after too many failed attempts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/login", validateRequest(loginSchemaObject), loginUser);

/**
 * @swagger
 * /refresh-token:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh the access token
 *     security: []
 *     description: >
 *       Reads the refresh token from the `refreshToken` cookie, falling back to `refreshToken` in the request body. On success, new tokens are set as httpOnly cookies.
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: refresh-token-value
 *     responses:
 *       '200':
 *         description: Token refreshed successfully (new tokens set as cookies)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       '401':
 *         description: Refresh token missing, invalid, expired, or revoked
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/refresh-token", refreshAccessToken);

/**
 * @swagger
 * /verify-email:
 *   get:
 *     tags: [Auth]
 *     summary: Verify a user email address
 *     security: []
 *     description: >
 *       verfies user email so user can login 
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Email verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/UserObject'
 *       '400':
 *         description: Request validation failed, or verification token is missing/invalid/expired
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/ValidationErrorResponse'
 *                 - $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/verify-email", validateRequest(incomingPassword), verifyEmail);

/**
 * @swagger
 * /resend-email-verification:
 *   post:
 *     tags: [Auth]
 *     summary: Resend the email verification link
 *     security: []
 *     description: resends verification email if previous ones is expired not delivered
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *     responses:
 *       '200':
 *         description: Verification email sent
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       '400':
 *         description: Email is already verified
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: User with this email does not exist
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/resend-email-verification", resendEmailVerification);

/**
 * @swagger
 * /reset-password-request:
 *   post:
 *     tags: [Auth]
 *     summary: Request a password reset email
 *     security: []
 *     description: >
 *       allows user to request for resetting the password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *     responses:
 *       '200':
 *         description: Reset email sent
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       '400':
 *         description: Request validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       '404':
 *         description: User with this email does not exist
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/reset-password-request",
  validateRequest(incomingEmail),
  resetPasswordRequest,
);

/**
 * @swagger
 * /reset-forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset a forgotten password
 *     security: []
 *     description: >
 *       this path resets the user's forgotten password.  
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, newPassword]
 *             properties:
 *               token:
 *                 type: string
 *                 example: reset-token-value
 *               newPassword:
 *                 type: string
 *                 example: NewStrongPassword123!
 *     responses:
 *       '200':
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       '400':
 *         description: Request validation failed, or reset token is missing/invalid/expired
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/ValidationErrorResponse'
 *                 - $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/reset-forgot-password",
  validateRequest(resetForgotPasswordObject),
  resetForgotPassword,
);

//protected

/**
 * @swagger
 * /logout:
 *   post:
 *     tags: [Auth]
 *     summary: Log out the current user
 *     security:
 *       - accessTokenCookie: []
 *     description: Clears accessToken/refreshToken cookies and unsets the stored refresh token.
 *     responses:
 *       '200':
 *         description: User logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       '401':
 *         description: Unauthorized (missing/invalid access token)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: Authenticated user ID no longer exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/logout", verifyJWT, logoutUser);

/**
 * @swagger
 * /me:
 *   get:
 *     tags: [Auth]
 *     summary: Get the authenticated user profile
 *     security:
 *       - accessTokenCookie: []
 *     responses:
 *       '200':
 *         description: User profile returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/UserObject'
 *       '401':
 *         description: Unauthorized (missing/invalid access token)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: Authenticated user ID no longer exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/me", verifyJWT, getCurrentUser);

/**
 * @swagger
 * /me:
 *   delete:
 *     tags: [Auth]
 *     summary: Delete (soft-delete) the authenticated user account
 *     security:
 *       - accessTokenCookie: []
 *     description: >
 *      soft delete the user.
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *                 example: secret123!#$
 *     responses:
 *       '200':
 *         description: Account deleted successfully (cookies cleared)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       '400':
 *         description: Request validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       '401':
 *         description: Unauthorized, or (if password supplied) incorrect password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete("/me", verifyJWT, validateRequest(incomingPassword), deleteUser);

/**
 * @swagger
 * /change-password:
 *   post:
 *     tags: [Auth]
 *     summary: Change the authenticated user's password
 *     security:
 *       - accessTokenCookie: []
 *     description: >
 *       Change the authenticated user's password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [oldPassword, newPassword]
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 example: oldPassword123!
 *               newPassword:
 *                 type: string
 *                 example: NewStrongPassword123!
 *     responses:
 *       '200':
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       '400':
 *         description: Request validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       '401':
 *         description: Unauthorized, or current password is incorrect
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/change-password",
  verifyJWT,
  validateRequest(changePasswordObject),
  changePassword,
);

export default router;
