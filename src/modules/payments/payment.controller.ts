import type { Request, Response } from "express";
import { env } from "../../config/env";
import { sendSuccess } from "../../utils/apiResponse";
import { catchAsync } from "../../utils/catchAsync";
import * as service from "./payment.service";

export const initiatePayment = catchAsync(async (req: Request, res: Response) => {
  const result = await service.initiatePayment(req.user!.id, req.body.serviceRequestId);
  sendSuccess(res, result, "Payment session created", 201);
});

// SSLCommerz posts form-encoded data to these — they redirect the browser
// back to the frontend once our backend has processed the result.
export const paymentSuccess = catchAsync(async (req: Request, res: Response) => {
  await service.handleGatewayCallback(req.body.tran_id, "VALID", req.body);
  res.redirect(`${env.clientUrl}/payments/result?status=success`);
});

export const paymentFail = catchAsync(async (req: Request, res: Response) => {
  await service.handleGatewayCallback(req.body.tran_id, "FAILED", req.body);
  res.redirect(`${env.clientUrl}/payments/result?status=failed`);
});

export const paymentCancel = catchAsync(async (req: Request, res: Response) => {
  await service.handleGatewayCallback(req.body.tran_id, "CANCELLED", req.body);
  res.redirect(`${env.clientUrl}/payments/result?status=cancelled`);
});

// Server-to-server IPN — source of truth, independent of the browser redirect.
export const paymentWebhook = catchAsync(async (req: Request, res: Response) => {
  await service.handleGatewayCallback(req.body.tran_id, "VALID", req.body);
  res.status(200).send("IPN received");
});

export const getPayment = catchAsync(async (req: Request, res: Response) => {
  const isPrivileged = req.user!.role === "ADMIN" || req.user!.role === "STAFF";
  const payment = await service.getPaymentById(req.params.id, req.user!.id, isPrivileged);
  sendSuccess(res, payment);
});
