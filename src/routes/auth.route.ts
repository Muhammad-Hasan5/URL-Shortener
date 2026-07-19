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
} from "../@types/auth/index.types.js";

const router = Router();

// Public routes
router.post(
  "/register",
  validateRequest(registerUserObject),
  registerUser,
);
router.post("/login", validateRequest(loginSchemaObject), loginUser);
router.post("/refresh-token", refreshAccessToken);
router.get(
  "/verify-email",
  verifyEmail,
);
router.post("/resend-email-verification", resendEmailVerification);
router.post(
  "/reset-password-request",
  resetPasswordRequest,
);
router.post(
  "/reset-forgot-password",
  resetForgotPassword,
);


//protected
router.post("/logout", verifyJWT, logoutUser);
router.get("/me", verifyJWT, getCurrentUser);
router.delete(
  "/me",
  verifyJWT,
  deleteUser,
);
router.post(
  "/change-password",
  verifyJWT,
  changePassword,
);

export default router;
