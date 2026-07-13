import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/auth-utils/tokens.utils.js";
import { fetchUserById } from "../repositories/auth.repository.js";

// Populates req.user for any route placed behind it. Reads the access token
// from the httpOnly cookie first, falling back to an Authorization header
// (useful for non-browser clients hitting the URL shortener's API directly).
export const verifyJWT = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        status: 401,
        data: null,
        msg: "unauthorized request",
      });
    }

    const decoded = verifyAccessToken(token);

    const user = await fetchUserById(decoded.id);

    if (!user) {
      return res.status(401).json({
        status: 401,
        data: null,
        msg: "invalid access token",
      });
    }

    req.user = { id: user.id, email: user.email };
    next();
  } catch (error: any) {
    return res.status(401).json({
      status: 401,
      data: null,
      msg: "invalid or expired access token",
    });
  }
};
