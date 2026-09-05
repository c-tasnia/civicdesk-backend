import type { Prisma, ServiceRequestStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import type { AuthPayload } from "../../middlewares/auth";
import { AppError } from "../../utils/AppError";
import { notifyUser } from "../notifications/notification.service";

const STAFF_ALLOWED_TRANSITIONS: Record<ServiceRequestStatus, ServiceRequestStatus[]> = {
  PENDING_PAYMENT: [],
  PAID: ["PROCESSING"],
  PROCESSING: ["APPROVED", "REJECTED"],
  APPROVED: ["COMPLETED"],
  REJECTED: [],
  COMPLETED: [],
};

export const createServiceRequest = async (
  citizenId: string,
  serviceTypeId: string,
  note?: string
) => {
  const serviceType = await prisma.serviceType.findFirst({
    where: { id: serviceTypeId, deletedAt: null },
  });
  if (!serviceType) throw new AppError("Service type not found", 404);

  return prisma.serviceRequest.create({
    data: {
      citizenId,
      serviceTypeId,
      departmentId: serviceType.departmentId,
      note,
      status: "PENDING_PAYMENT",
    },
    include: { serviceType: true },
  });
};

export const listServiceRequests = async (
  actor: AuthPayload,
  query: { page?: string; limit?: string; status?: ServiceRequestStatus }
) => {
  const page = Math.max(1, Number(query.page ?? 1));
  const limit = Math.min(50, Math.max(1, Number(query.limit ?? 10)));

  const where: Record<string, unknown> = { deletedAt: null };
  if (query.status) where.status = query.status;
  if (actor.role === "CITIZEN") where.citizenId = actor.id;
  if (actor.role === "STAFF") {
    const staff = await prisma.user.findUnique({ where: { id: actor.id } });
    where.departmentId = staff?.departmentId ?? "__none__";
  }

  const [items, total] = await prisma.$transaction([
    prisma.serviceRequest.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { serviceType: true, citizen: { select: { id: true, name: true, email: true } } },
    }),
    prisma.serviceRequest.count({ where }),
  ]);

  return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

export const getServiceRequestById = async (id: string, actor: AuthPayload) => {
  const request = await prisma.serviceRequest.findFirst({
    where: { id, deletedAt: null },
    include: { serviceType: true, payments: true, citizen: { select: { id: true, name: true } } },
  });
  if (!request) throw new AppError("Service request not found", 404);
  if (actor.role === "CITIZEN" && request.citizenId !== actor.id) {
    throw new AppError("You do not have access to this request", 403);
  }
  return request;
};

export const updateServiceRequestStatus = async (
  id: string,
  newStatus: ServiceRequestStatus,
  actorId: string
) => {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const request = await tx.serviceRequest.findFirst({ where: { id, deletedAt: null } });
    if (!request) throw new AppError("Service request not found", 404);

    const allowed = STAFF_ALLOWED_TRANSITIONS[request.status];
    if (!allowed.includes(newStatus)) {
      throw new AppError(
        `Cannot transition service request from ${request.status} to ${newStatus}`,
        400
      );
    }

    const updated = await tx.serviceRequest.update({ where: { id }, data: { status: newStatus } });

    await notifyUser(tx, request.citizenId, {
      title: "Service request update",
      message: `Your service request is now ${newStatus}`,
      type: "SERVICE_REQUEST_UPDATE",
    });

    return updated;
  });
};
