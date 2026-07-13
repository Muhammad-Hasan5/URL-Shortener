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
import { registerUserObject, loginSchemaObject, incomingPassword, incomingEmail, changePasswordObject, resetForgotPasswordObject} from "../@types/auth/index.types.js";

const router = Router();

// Public routes
router.post("/register", validateRequest(registerUserObject), registerUser);
router.post("/login", validateRequest(loginSchemaObject), loginUser);
router.post("/refresh-token", refreshAccessToken);
router.get("/verify-email", validateRequest(incomingPassword), verifyEmail);
router.post("/resend-email-verification", resendEmailVerification);
router.post(
  "/reset-password-request",
  validateRequest(incomingEmail),
  resetPasswordRequest,
);
router.post("/reset-forgot-password", validateRequest(resetForgotPasswordObject), resetForgotPassword);
//protected
router.post("/logout", verifyJWT, logoutUser);
router.get("/me", verifyJWT, getCurrentUser);
router.delete("/me", verifyJWT, validateRequest(incomingPassword), deleteUser);
router.post(
  "/change-password",
  verifyJWT,
  validateRequest(changePasswordObject),
  changePassword,
);

export default router;
