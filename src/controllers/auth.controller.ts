import type { Request, Response } from "express";
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

const cookieOptions = {
  secure: true,
  httpOnly: true,
  sameSite: "strict" as const,
};

export const registerUser = async (req: Request, res: Response) => {
  const userData = req.body;

  const response = await registerUserService(userData);

  if (response.status === 499) {
    return res.status(499).json({
      status: 499,
      data: response.data,
      msg: response.error,
    });
  } else if (response.status === 400) {
    return res.status(400).json({
      status: 400,
      data: response.data,
      msg: response.error,
    });
  }

  return res.status(201).json({
    status: 201,
    data: response.data,
    msg: response.error,
  });
};

export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const response = await loginUserService(email, password, req);

  if (response.status === 404) {
    return res.status(404).json({
      status: 404,
      data: null,
      msg: response.error,
    });
  } else if (response.status === 403) {
    return res.status(403).json({
      status: 403,
      data: null,
      msg: response.error,
    });
  } else if (response.status === 401) {
    return res.status(401).json({
      status: 401,
      data: null,
      msg: response.error,
    });
  } else if (response.status === 400) {
    return res.status(400).json({
      status: 400,
      data: null,
      msg: response.error,
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
};

export const logoutUser = async (req: Request, res: Response) => {
  const response = await logoutUserService(req.user?.id);

  if (response.status == 404) {
    return res.status(404).json({
      status: 404,
      msg: response.error,
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
};

export const getCurrentUser = async (req: Request, res: Response) => {
  const response = await getCurrentUserService(req.user?.id);

  if (response.status !== 200) {
    return res.status(response.status).json({
      status: response.status,
      data: null,
      msg: response.error,
    });
  }

  return res.status(200).json({
    status: 200,
    data: response.data,
    msg: "current user fetched successfully",
  });
};

export const deleteUser = async (req: Request, res: Response) => {
  const { password } = req.body;

  const response = await deleteUserService(req.user?.id, password);

  if (response.status !== 200) {
    return res.status(response.status).json({
      status: response.status,
      data: null,
      msg: response.error,
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
};

export const verifyEmail = async (req: Request, res: Response) => {
  const { token } = req.query as { token?: string };

  const response = await verifyEmailService(token);

  if (response.status !== 200) {
    return res.status(response.status).json({
      status: response.status,
      data: null,
      msg: response.error,
    });
  }

  return res.status(200).json({
    status: 200,
    data: response.data,
    msg: "email verified successfully",
  });
};

export const resendEmailVerification = async (req: Request, res: Response) => {
  const { email } = req.body;

  const response = await resendEmailVerificationService(email);

  if (response.status !== 200) {
    return res.status(response.status).json({
      status: response.status,
      data: null,
      msg: response.error,
    });
  }

  return res.status(200).json({
    status: 200,
    data: null,
    msg: "verification email sent",
  });
};

export const resetPasswordRequest = async (req: Request, res: Response) => {
  const { email } = req.body;

  const response = await resetPasswordRequestService(email);

  if (response.status !== 200) {
    return res.status(response.status).json({
      status: response.status,
      data: null,
      msg: response.error,
    });
  }

  return res.status(200).json({
    status: 200,
    data: null,
    msg: "password reset email sent",
  });
};

export const resetForgotPassword = async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;

  const response = await resetForgotPasswordService(token, newPassword);

  if (response.status !== 200) {
    return res.status(response.status).json({
      status: response.status,
      data: null,
      msg: response.error,
    });
  }

  return res.status(200).json({
    status: 200,
    data: null,
    msg: "password reset successfully",
  });
};

export const changePassword = async (req: Request, res: Response) => {
  const { oldPassword, newPassword } = req.body;

  const response = await changePasswordService(
    req.user?.id,
    oldPassword,
    newPassword,
  );

  if (response.status !== 200) {
    return res.status(response.status).json({
      status: response.status,
      data: null,
      msg: response.error,
    });
  }

  return res.status(200).json({
    status: 200,
    data: null,
    msg: "password changed successfully",
  });
};

export const refreshAccessToken = async (req: Request, res: Response) => {
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
        msg: response.error,
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
};
