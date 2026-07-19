import type { Request } from "express";
import type { registerUserType } from "../@types/auth/index.types.js";
import {
  checkIfUserExists,
  fetchUserByEmail,
  fetchUserById,
  fetchUserByEmailVerificationToken,
  fetchUserByPasswordResetToken,
  insertNewUser,
  markEmailAsVerified,
  setPasswordResetToken,
  softDeleteUser,
  updateUserPassword,
  updateVerificationTokens,
  recordFailedLogin,
  recordSuccessfulLogin,
  clearRefreshToken,
  rotateRefreshToken,
} from "../repositories/auth.repository.js";
import { getClientIp } from "../utils/analytics-utils/getClientIP.js";
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "../utils/auth-utils/email.utils.js";
import {
  hashPassword,
  verifyPassword,
} from "../utils/auth-utils/hashPassword.utils.js";
import {
  generateAccessToken,
  generateRandomToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/auth-utils/tokens.utils.js";
import { haship } from "../utils/analytics-utils/haship.js";
import logger from "../observability/pino-logging/index.pino.js";
import crypto from "crypto";

type authServiceResponse = {
  status: number;
  msg?: any;
  data?: any;
};

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_SECONDS = 15 * 60;

const DUMMY_PASSWORD_HASH =
  process.env.DUMMY_PASSWORD_HASH ||
  "$2b$10$CwTycUXWue0Thq9StjUM0uJ8g/vFuk1XdMk1u5D9y3z1CTHi3Ky1a";

const sanitizeUser = (user: any) => {
  if (!user) return null;
  const {
    password_hash,
    refresh_token_hash,
    email_verification_token,
    email_verification_expires_at,
    password_reset_token,
    password_reset_expires_at,
    ...safeUser
  } = user;
  return safeUser;
};

const hashToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");

export const registerUserService = async (
  user: registerUserType,
): Promise<authServiceResponse> => {
  const exists = await checkIfUserExists(user.email);

  if (exists) {
    return {
      status: 409,
      msg: "user with this email already exists",
      data: null,
    };
  }

  const { unHashedToken, hashedToken, tokenExpiry } =
    generateRandomToken("email");

  const hashedPass = await hashPassword(user.password);

  let newUser;
  try {
    newUser = await insertNewUser({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: hashedPass,
      emailVerificationToken: hashedToken,
      emailVerificationTokenExpiry: tokenExpiry,
    });
  } catch (error: any) {
    if (error.code === "USER_EXISTS") {
      return {
        status: 409,
        msg: "user with this email already exists",
        data: null,
      };
    }
    throw error;
  }

  try {
    await sendVerificationEmail(newUser.email, unHashedToken);
  } catch (error: any) {
    logger.error("failed to send verification email on registration", error);
  }

  return {
    status: 201,
    data: { user: sanitizeUser(newUser) },
  };
};

export const loginUserService = async (
  email: string,
  password: string,
  req: Request,
): Promise<authServiceResponse> => {
  const user = await fetchUserByEmail(email);

  if (!user) {
    //  a dummy hash comparison so response timing is the same whether
    // the email exists or not, to reduce email-enumeration risk.
    await verifyPassword(DUMMY_PASSWORD_HASH, password).catch(() => {});
    return {
      status: 404,
      msg: "invalid credentials",
      data: null,
    };
  }

  if (user.status !== "active") {
    return {
      status: 403,
      msg: "account is not active",
      data: null,
    };
  }

  if (!user.email_verified) {
    return {
      status: 400,
      msg: "email is not verified",
      data: null,
    };
  }

  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    return {
      status: 403,
      msg: "account is temporarily locked, try again later",
      data: null,
    };
  }

  const valid = await verifyPassword(user.password_hash, password);

  if (!valid) {
    // atomic SQL increment instead of read-modify-write, so concurrent
    // failed attempts from different instances can't clobber each other.
    await recordFailedLogin(
      user.id,
      MAX_FAILED_ATTEMPTS,
      LOCKOUT_DURATION_SECONDS,
    );

    return {
      status: 401,
      msg: "invalid credentials",
      data: null,
    };
  }

  const accessToken = generateAccessToken(user.id, user.email);
  const refreshToken = generateRefreshToken(user.email);

  const ip = getClientIp(req);
  const hashedIP = ip ? haship(ip, new Date()) : null;

  const loggedInUser = await recordSuccessfulLogin(
    user.id,
    hashedIP,
    hashToken(refreshToken),
  );

  return {
    status: 200,
    data: {
      loggedInUser: sanitizeUser(loggedInUser),
      refreshToken,
      accessToken,
    },
  };
};

export const logoutUserService = async (
  id?: string,
): Promise<authServiceResponse> => {
  if (!id) {
    return {
      status: 404,
      msg: "user with this ID not exists",
      data: null,
    };
  }

  const user = await fetchUserById(id);

  if (!user) {
    return {
      status: 404,
      msg: "user with this ID not exists",
      data: null,
    };
  }

  await clearRefreshToken(id);

  return {
    status: 200,
    data: null,
  };
};

export const getCurrentUserService = async (
  id?: string,
): Promise<authServiceResponse> => {
  if (!id) {
    return { status: 401, msg: "unauthorized", data: null };
  }

  const user = await fetchUserById(id);

  if (!user) {
    return { status: 404, msg: "user not found", data: null };
  }

  return { status: 200, data: sanitizeUser(user) };
};

export const deleteUserService = async (
  id?: string,
  password?: string,
): Promise<authServiceResponse> => {
  if (!id) {
    return { status: 401, msg: "unauthorized", data: null };
  }

  const user = await fetchUserById(id);

  if (!user) {
    return { status: 404, msg: "user not found", data: null };
  }


  if (!password) {
    return { status: 400, msg: "password is required", data: null };
  }

  const valid = await verifyPassword(user.password_hash, password);
  if (!valid) {
    return { status: 401, msg: "invalid credentials", data: null };
  }

  await softDeleteUser(id);

  return { status: 200, data: null };
};

export const verifyEmailService = async (
  token?: string,
): Promise<authServiceResponse> => {
  if (!token) {
    return { status: 400, msg: "verification token is required", data: null };
  }

  const hashedToken = hashToken(token);
  const user = await fetchUserByEmailVerificationToken(hashedToken);

  if (!user) {
    return {
      status: 400,
      msg: "invalid or expired verification token",
      data: null,
    };
  }

  if (user.email_verified) {
    return { status: 200, data: sanitizeUser(user) };
  }

  if (
    !user.email_verification_expires_at ||
    new Date(user.email_verification_expires_at) < new Date()
  ) {
    return {
      status: 400,
      msg: "invalid or expired verification token",
      data: null,
    };
  }

  const verifiedUser = await markEmailAsVerified(user.id);

  return { status: 200, data: sanitizeUser(verifiedUser) };
};

export const resendEmailVerificationService = async (
  email: string,
): Promise<authServiceResponse> => {
  const user = await fetchUserByEmail(email);

  if (!user) {
    return { status: 200, data: null };
  }

  if (user.email_verified) {
    return { status: 400, msg: "email is already verified", data: null };
  }

  const { unHashedToken, hashedToken, tokenExpiry } =
    generateRandomToken("email");

  await updateVerificationTokens(user.email, hashedToken, tokenExpiry);
  await sendVerificationEmail(user.email, unHashedToken);

  return { status: 200, data: null };
};

export const resetPasswordRequestService = async (
  email: string,
): Promise<authServiceResponse> => {
  const user = await fetchUserByEmail(email);

  if (!user) {
    return { status: 200, data: null };
  }

  const { unHashedToken, hashedToken, tokenExpiry } =
    generateRandomToken("password");

  await setPasswordResetToken(user.email, hashedToken, tokenExpiry);
  await sendPasswordResetEmail(user.email, unHashedToken);

  return { status: 200, data: null };
};

export const resetForgotPasswordService = async (
  token: string,
  newPassword: string,
): Promise<authServiceResponse> => {
  if (!token || !newPassword) {
    return {
      status: 400,
      msg: "token and new password are required",
      data: null,
    };
  }

  const hashedToken = hashToken(token);
  const user = await fetchUserByPasswordResetToken(hashedToken);

  if (!user) {
    return { status: 400, msg: "invalid or expired reset token", data: null };
  }

  if (
    !user.password_reset_expires_at ||
    new Date(user.password_reset_expires_at) < new Date()
  ) {
    return { status: 400, msg: "invalid or expired reset token", data: null };
  }

  const hashedPassword = await hashPassword(newPassword);
  await updateUserPassword(user.id, hashedPassword);

  return { status: 200, data: null };
};

export const changePasswordService = async (
  id: string | undefined,
  oldPassword: string,
  newPassword: string,
): Promise<authServiceResponse> => {
  if (!id) {
    return { status: 401, msg: "unauthorized", data: null };
  }

  const user = await fetchUserById(id);

  if (!user) {
    return { status: 404, msg: "user not found", data: null };
  }

  const valid = await verifyPassword(user.password_hash, oldPassword);

  if (!valid) {
    return { status: 401, msg: "current password is incorrect", data: null };
  }

  const hashedPassword = await hashPassword(newPassword);
  await updateUserPassword(user.id, hashedPassword);

  return { status: 200, data: null };
};

export const refreshAccessTokenService = async (
  incomingRefreshToken?: string,
): Promise<authServiceResponse> => {
  if (!incomingRefreshToken) {
    return { status: 401, msg: "refresh token is required", data: null };
  }

  let decoded: { email: string };
  try {
    decoded = verifyRefreshToken(incomingRefreshToken);
  } catch (error) {
    return {
      status: 401,
      msg: "invalid or expired refresh token",
      data: null,
    };
  }

  const user = await fetchUserByEmail(decoded.email);

  if (!user) {
    return { status: 401, msg: "invalid refresh token", data: null };
  }

  const oldHash = hashToken(incomingRefreshToken);
  const accessToken = generateAccessToken(user.id, user.email);
  const refreshToken = generateRefreshToken(user.email);
  const newHash = hashToken(refreshToken);


  const rotated = await rotateRefreshToken(user.id, oldHash, newHash);

  if (!rotated) {
    await clearRefreshToken(user.id);
    return { status: 401, msg: "refresh token has been revoked", data: null };
  }

  return { status: 200, data: { accessToken, refreshToken } };
};
