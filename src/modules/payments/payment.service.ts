import crypto from "node:crypto";
import type { Prisma } from "@prisma/client";
import SSLCommerzPayment from "sslcommerz-lts";
import { env } from "../../config/env";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { notifyUser } from "../notifications/notification.service";

const sslcz = new SSLCommerzPayment(
  env.sslcommerz.storeId,
  env.sslcommerz.storePassword,
  env.sslcommerz.isLive
);

export const initiatePayment = async (userId: string, serviceRequestId: string) => {
  const request = await prisma.serviceRequest.findFirst({
    where: { id: serviceRequestId, deletedAt: null },
    include: { serviceType: true, citizen: true },
  });
  if (!request) throw new AppError("Service request not found", 404);
  if (request.citizenId !== userId) throw new AppError("You do not own this service request", 403);
  if (request.status !== "PENDING_PAYMENT") {
    throw new AppError("This service request is not awaiting payment", 400);
  }

  const transactionId = `CD-${crypto.randomBytes(8).toString("hex").toUpperCase()}`;

  const payment = await prisma.payment.create({
    data: {
      serviceRequestId,
      userId,
      amount: request.serviceType.fee,
      transactionId,
      status: "INITIATED",
    },
  });

  const sessionData = {
    total_amount: Number(request.serviceType.fee),
    currency: "BDT",
    tran_id: transactionId,
    success_url: `${env.serverUrl}/api/v1/payments/success`,
    fail_url: `${env.serverUrl}/api/v1/payments/fail`,
    cancel_url: `${env.serverUrl}/api/v1/payments/cancel`,
    ipn_url: `${env.serverUrl}/api/v1/payments/webhook`,
    shipping_method: "NO",
    product_name: request.serviceType.name,
    product_category: "Municipal Service",
    product_profile: "general",
    cus_name: request.citizen.name,
    cus_email: request.citizen.email,
    cus_add1: "N/A",
    cus_city: "N/A",
    cus_postcode: "N/A",
    cus_country: "Bangladesh",
    cus_phone: request.citizen.phone ?? "N/A",
  };

  const apiResponse = await sslcz.init(sessionData);
  if (!apiResponse?.GatewayPageURL) {
    throw new AppError("Failed to initiate payment session with gateway", 502);
  }

  return { paymentId: payment.id, transactionId, gatewayUrl: apiResponse.GatewayPageURL };
};

/**
 * Called from success/fail/cancel redirects AND the IPN webhook.
 * Always re-validates the transaction with SSLCommerz server-side before
 * trusting the reported status — never trust the redirect body alone.
 */
export const handleGatewayCallback = async (
  transactionId: string,
  gatewayStatus: "VALID" | "FAILED" | "CANCELLED" | string,
  rawPayload: unknown
) => {
  const payment = await prisma.payment.findUnique({ where: { transactionId } });
  if (!payment) throw new AppError("Payment record not found", 404);

  // Re-validate with SSLCommerz to prevent spoofed callbacks
  let verified = gatewayStatus === "VALID";
  try {
    const validation = await sslcz.validate({
      val_id: (rawPayload as { val_id?: string })?.val_id,
    });
    verified = validation?.status === "VALID" || validation?.status === "VALIDATED";
  } catch {
    // If validation call itself fails, fall back to the reported status only
    // for non-success cases; a success must be independently verifiable.
    if (gatewayStatus === "VALID") verified = false;
  }

  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const status = verified ? "SUCCESS" : gatewayStatus === "CANCELLED" ? "CANCELLED" : "FAILED";

    const updatedPayment = await tx.payment.update({
      where: { transactionId },
      data: { status, gatewayResponse: rawPayload as object },
    });

    if (status === "SUCCESS") {
      await tx.serviceRequest.update({
        where: { id: payment.serviceRequestId },
        data: { status: "PAID" },
      });
      await notifyUser(tx, payment.userId, {
        title: "Payment successful",
        message: "Your payment was received and your service request is now being processed.",
        type: "PAYMENT",
      });
    } else {
      await notifyUser(tx, payment.userId, {
        title: "Payment not completed",
        message: `Your payment ${status.toLowerCase()}. Please try again.`,
        type: "PAYMENT",
      });
    }

    return updatedPayment;
  });
};

export const getPaymentById = async (id: string, userId: string, isPrivileged: boolean) => {
  const payment = await prisma.payment.findUnique({ where: { id } });
  if (!payment) throw new AppError("Payment not found", 404);
  if (!isPrivileged && payment.userId !== userId) {
    throw new AppError("You do not have access to this payment", 403);
  }
  return payment;
};
