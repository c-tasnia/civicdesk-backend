import { Prisma } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError";
import { sendError } from "../utils/apiResponse";

export const notFoundHandler = (req: Request, res: Response) => {
  sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (err: unknown, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode, err.errors);
  }

  if (err instanceof ZodError) {
    const errors = err.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));
    return sendError(res, "Validation failed", 422, errors);
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return sendError(res, "A record with this value already exists", 409, [
        { fields: err.meta?.target },
      ]);
    }
    if (err.code === "P2025") {
      return sendError(res, "Record not found", 404);
    }
  }

  console.error(err);
  return sendError(res, "Internal server error", 500);
};
