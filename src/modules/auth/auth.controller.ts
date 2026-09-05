import type { Request, Response } from "express";
import { AppError } from "../../utils/AppError";
import { sendSuccess } from "../../utils/apiResponse";
import { catchAsync } from "../../utils/catchAsync";
import * as authService from "./auth.service";
import { buildGoogleAuthUrl, exchangeGoogleCode } from "./google.helper";

export const register = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.registerUser(req.body);
  sendSuccess(res, result, "Account created successfully", 201);
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result = await authService.loginUser(email, password);
  sendSuccess(res, result, "Logged in successfully");
});

export const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.refreshAccessToken(req.body.refreshToken);
  sendSuccess(res, result, "Token refreshed successfully");
});

export const logout = catchAsync(async (req: Request, res: Response) => {
  await authService.logoutUser(req.body.refreshToken);
  sendSuccess(res, null, "Logged out successfully");
});

export const googleRedirect = catchAsync(async (req: Request, res: Response) => {
  res.redirect(buildGoogleAuthUrl());
});

export const googleCallback = catchAsync(async (req: Request, res: Response) => {
  const code = req.query.code as string;
  if (!code) throw new AppError("Missing Google authorization code", 400);

  const profile = await exchangeGoogleCode(code);
  const result = await authService.loginWithGoogle(profile);
  sendSuccess(res, result, "Logged in with Google successfully");
});
