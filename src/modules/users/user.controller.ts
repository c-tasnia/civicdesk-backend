import type { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { sendSuccess } from "../../utils/apiResponse";
import { catchAsync } from "../../utils/catchAsync";

export const getMe = catchAsync(async (req: Request, res: Response) => {
  const user = await prisma.user.findFirst({
    where: { id: req.user!.id, deletedAt: null },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      avatarUrl: true,
      role: true,
      department: { select: { id: true, name: true } },
      createdAt: true,
    },
  });
  if (!user) throw new AppError("User not found", 404);
  sendSuccess(res, user);
});

export const updateMe = catchAsync(async (req: Request, res: Response) => {
  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: req.body,
    select: { id: true, name: true, phone: true, avatarUrl: true },
  });
  sendSuccess(res, user, "Profile updated successfully");
});
