import type { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { sendSuccess } from "../../utils/apiResponse";
import { catchAsync } from "../../utils/catchAsync";

export const listUsers = catchAsync(async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 10)));
  const { role } = req.query;

  const where: Record<string, unknown> = { deletedAt: null };
  if (role) where.role = role;

  const [items, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        departmentId: true,
        createdAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  sendSuccess(res, { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});

export const updateUserRole = catchAsync(async (req: Request, res: Response) => {
  const { role, departmentId } = req.body;
  if (role === "STAFF" && !departmentId) {
    throw new AppError("departmentId is required when assigning the STAFF role", 422);
  }

  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { role, departmentId: role === "STAFF" ? departmentId : null },
    select: { id: true, name: true, role: true, departmentId: true },
  });

  await prisma.auditLog.create({
    data: {
      actorId: req.user!.id,
      action: "UPDATE_USER_ROLE",
      entityType: "User",
      entityId: user.id,
      metadata: { newRole: role, departmentId },
    },
  });

  sendSuccess(res, user, "User role updated successfully");
});

export const deleteUser = catchAsync(async (req: Request, res: Response) => {
  await prisma.user.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } });
  await prisma.auditLog.create({
    data: {
      actorId: req.user!.id,
      action: "DELETE_USER",
      entityType: "User",
      entityId: req.params.id,
    },
  });
  sendSuccess(res, null, "User deleted successfully");
});

export const dashboardStats = catchAsync(async (req: Request, res: Response) => {
  const [
    totalUsers,
    totalComplaints,
    pendingComplaints,
    resolvedComplaints,
    totalRevenueAgg,
    totalServiceRequests,
  ] = await prisma.$transaction([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.complaint.count({ where: { deletedAt: null } }),
    prisma.complaint.count({ where: { deletedAt: null, status: "PENDING" } }),
    prisma.complaint.count({ where: { deletedAt: null, status: { in: ["RESOLVED", "CLOSED"] } } }),
    prisma.payment.aggregate({ where: { status: "SUCCESS" }, _sum: { amount: true } }),
    prisma.serviceRequest.count({ where: { deletedAt: null } }),
  ]);

  sendSuccess(res, {
    totalUsers,
    totalComplaints,
    pendingComplaints,
    resolvedComplaints,
    totalServiceRequests,
    totalRevenue: totalRevenueAgg._sum.amount ?? 0,
  });
});

export const listAuditLogs = catchAsync(async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 20)));

  const [items, total] = await prisma.$transaction([
    prisma.auditLog.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { actor: { select: { name: true, role: true } } },
    }),
    prisma.auditLog.count(),
  ]);

  sendSuccess(res, { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});
