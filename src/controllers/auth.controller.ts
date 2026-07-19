import type { NextFunction, Request, Response } from "express";
import {
  changePasswordService,
  deleteUserService,
  getCurrentUserService,
  loginUserService,
  logoutUserService,
  refreshAccessTokenService,
  registerUserService,
  resendEmailVerificationService,
  resetForgotPasswordService,
  resetPasswordRequestService,
  verifyEmailService,
} from "../services/auth.service.js";
import { asyncHandler } from "../utils/asyncHandler.utils.js";

const cookieOptions = {
  secure: true,
  httpOnly: true,
  sameSite: "strict" as const,
};



export const registerUser = asyncHandler(
  async (req: Request, res: Response) => {
    const { firstName, lastName, email, password } = req.body ?? {};

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        status: 400,
        data: null,
        msg: "firstName, lastName, email and password are required",
      });
    }

    const response = await registerUserService(req.body);

    return res.status(response.status).json({
      status: response.status,
      data: response.data,
      msg: response.msg,
    });
  },
);

export const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    return res.status(400).json({
      status: 400,
      data: null,
      msg: "email and password are required",
    });
  }

  const response = await loginUserService(email, password, req);

  if (response.status !== 200) {
    return res.status(response.status).json({
      status: response.status,
      data: response.data,
      msg: response.msg,
    });
  }

  return res
    .status(200)
    .cookie("accessToken", response.data?.accessToken, cookieOptions)
    .cookie("refreshToken", response.data?.refreshToken, cookieOptions)
    .json({
      status: 200,
      data: response.data?.loggedInUser,
      msg: "user logged successfully",
    });
});

export const logoutUser = asyncHandler(async (req: Request, res: Response) => {
  const response = await logoutUserService(req.user?.id);

  if (response.status !== 200) {
    return res.status(response.status).json({
      status: response.status,
      msg: response.msg,
    });
  }

  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json({
      status: 200,
      data: response.data,
      msg: "user logged out",
    });
});

export const getCurrentUser = asyncHandler(
  async (req: Request, res: Response) => {
    const response = await getCurrentUserService(req.user?.id);

    if (response.status !== 200) {
      return res.status(response.status).json({
        status: response.status,
        data: response.data,
        msg: response.msg,
      });
    }

    return res.status(200).json({
      status: 200,
      data: response.data,
      msg: "current user fetched successfully",
    });
  },
);

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const { password } = req.body ?? {};

  const response = await deleteUserService(req.user?.id, password);

  if (response.status !== 200) {
    return res.status(response.status).json({
      status: response.status,
      data: response.data,
      msg: response.msg,
    });
  }

  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json({
      status: 200,
      data: null,
      msg: "account deleted",
    });
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.query as { token?: string };

  const response = await verifyEmailService(token);

  if (response.status !== 200) {
    return res.status(response.status).json({
      status: response.status,
      data: response.data,
      msg: response.msg,
    });
  }

  return res.status(200).json({
    status: 200,
    data: response.data,
    msg: "email verified successfully",
  });
});

export const resendEmailVerification = asyncHandler(
  async (req: Request, res: Response) => {
    const { email } = req.body ?? {};

    if (!email) {
      return res
        .status(400)
        .json({ status: 400, data: null, msg: "email is required" });
    }

    const response = await resendEmailVerificationService(email);

    return res.status(response.status).json({
      status: response.status,
      data: null,
      msg:
        response.status === 200
          ? "if an account exists, a verification email has been sent"
          : response.msg,
    });
  },
);

export const resetPasswordRequest = asyncHandler(
  async (req: Request, res: Response) => {
    const { email } = req.body ?? {};

    if (!email) {
      return res
        .status(400)
        .json({ status: 400, data: null, msg: "email is required" });
    }

    const response = await resetPasswordRequestService(email);

    return res.status(response.status).json({
      status: response.status,
      data: null,
      msg: "if an account exists, a password reset email has been sent",
    });
  },
);

export const resetForgotPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { token, newPassword } = req.body ?? {};

    const response = await resetForgotPasswordService(token, newPassword);

    if (response.status !== 200) {
      return res.status(response.status).json({
        status: response.status,
        data: null,
        msg: response.msg,
      });
    }

    return res.status(200).json({
      status: 200,
      data: null,
      msg: "password reset successfully",
    });
  },
);

export const changePassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { oldPassword, newPassword } = req.body ?? {};

    const response = await changePasswordService(
      req.user?.id,
      oldPassword,
      newPassword,
    );

    if (response.status !== 200) {
      return res.status(response.status).json({
        status: response.status,
        data: response.data,
        msg: response.msg,
      });
    }

    return res.status(200).json({
      status: 200,
      data: null,
      msg: "password changed successfully",
    });
  },
);

export const refreshAccessToken = asyncHandler(
  async (req: Request, res: Response) => {
    const incomingRefreshToken =
      req.cookies?.refreshToken || req.body?.refreshToken;

    const response = await refreshAccessTokenService(incomingRefreshToken);

    if (response.status !== 200) {
      return res
        .status(response.status)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json({
          status: response.status,
          data: null,
          msg: response.msg,
        });
    }

    return res
      .status(200)
      .cookie("accessToken", response.data.accessToken, cookieOptions)
      .cookie("refreshToken", response.data.refreshToken, cookieOptions)
      .json({
        status: 200,
        data: null,
        msg: "access token refreshed",
      });
  },
);
