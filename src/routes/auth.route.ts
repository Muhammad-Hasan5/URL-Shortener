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
router.post(
  "api/v1/register",
  validateRequest(registerUserObject),
  registerUser,
);
router.post("api/v1/login", validateRequest(loginSchemaObject), loginUser);
router.post("api/v1/refresh-token", refreshAccessToken);
router.get(
  "api/v1/verify-email",
  validateRequest(incomingPassword),
  verifyEmail,
);
router.post("api/v1/resend-email-verification", resendEmailVerification);
router.post(
  "api/v1/reset-password-request",
  validateRequest(incomingEmail),
  resetPasswordRequest,
);
router.post(
  "api/v1/reset-forgot-password",
  validateRequest(resetForgotPasswordObject),
  resetForgotPassword,
);
//protected
router.post("api/v1/logout", verifyJWT, logoutUser);
router.get("api/v1/me", verifyJWT, getCurrentUser);
router.delete(
  "api/v1/me",
  verifyJWT,
  validateRequest(incomingPassword),
  deleteUser,
);
router.post(
  "api/v1/change-password",
  verifyJWT,
  validateRequest(changePasswordObject),
  changePassword,
);

export default router;
