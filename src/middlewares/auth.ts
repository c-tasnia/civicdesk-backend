import type { Role } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";

export interface AuthPayload {
  id: string;
  role: Role;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw new AppError("Authentication token missing", 401);
    }
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, env.jwt.accessSecret) as AuthPayload;

    const user = await prisma.user.findFirst({
      where: { id: decoded.id, deletedAt: null },
      select: { id: true, role: true },
    });

    if (!user) {
      throw new AppError("User no longer exists", 401);
    }

    req.user = { id: user.id, role: user.role };
    next();
  } catch (err) {
    if (err instanceof AppError) return next(err);
    next(new AppError("Invalid or expired token", 401));
  }
};

export const authorize = (...roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return next(new AppError("Authentication required", 401));
    if (!roles.includes(req.user.role)) {
      return next(new AppError("You do not have permission to perform this action", 403));
    }
    next();
  };
};
