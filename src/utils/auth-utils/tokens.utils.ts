import jwt from "jsonwebtoken";
import crypto from "crypto";
import env from "../../config/env.js";
import type { StringValue } from "ms";

export const generateAccessToken = (id: string, email: string) => {
  const payload = {
    id,
    email,
  };
  const secret = env.ACCESS_TOKEN_SECRET as string;
  return jwt.sign(payload, secret, {
    expiresIn: env.ACCESS_TOKEN_EXPIRY as StringValue,
  });
};

export const generateRefreshToken = (email: string) => {
  const payload = {
    email,
  };
  const secret = env.REFRESH_TOKEN_SECRET as string;
  return jwt.sign(payload, secret, {
    expiresIn: env.REFRESH_TOKEN_EXPIRY as StringValue,
  });
};


export const generateRandomToken = (purpose: "password" | "email") => {
  const unHashedToken = crypto.randomBytes(20).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(unHashedToken)
    .digest("hex");

  const ttlMs = purpose === "email" ? 24 * 60 * 60 * 1000 : 15 * 60 * 1000;
  const tokenExpiry = new Date(Date.now() + ttlMs);

  return {
    unHashedToken,
    hashedToken,
    tokenExpiry,
  };
};

export const verifyRefreshToken = (token: string) => {
  const secret = env.REFRESH_TOKEN_SECRET as string;
  return jwt.verify(token, secret) as { email: string };
};

export const verifyAccessToken = (token: string) => {
  const secret = env.ACCESS_TOKEN_SECRET as string;
  return jwt.verify(token, secret) as { id: string; email: string };
};
