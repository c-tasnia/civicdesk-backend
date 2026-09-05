import { type ComplaintStatus, type Prisma, Role } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import type { AuthPayload } from "../../middlewares/auth";
import { AppError } from "../../utils/AppError";
import { notifyUser } from "../notifications/notification.service";

const ALLOWED_TRANSITIONS: Record<ComplaintStatus, ComplaintStatus[]> = {
  PENDING: ["ASSIGNED", "REJECTED"],
  ASSIGNED: ["IN_PROGRESS", "REJECTED"],
  IN_PROGRESS: ["RESOLVED", "REJECTED"],
  RESOLVED: ["CLOSED"],
  REJECTED: [],
  CLOSED: [],
};

export const createComplaint = async (
  citizenId: string,
  input: {
    departmentId: string;
    category: string;
    title: string;
    description: string;
    location: string;
    latitude?: number;
    longitude?: number;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  }
) => {
  const department = await prisma.department.findFirst({
    where: { id: input.departmentId, deletedAt: null },
  });
  if (!department) throw new AppError("Department not found", 404);

  return prisma.complaint.create({
    data: { ...input, citizenId },
    include: { department: { select: { id: true, name: true } } },
  });
};

export const listComplaints = async (
  actor: AuthPayload,
  query: {
    page?: string;
    limit?: string;
    status?: ComplaintStatus;
    priority?: string;
    departmentId?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }
) => {
  const page = Math.max(1, Number(query.page ?? 1));
  const limit = Math.min(50, Math.max(1, Number(query.limit ?? 10)));

  const where: Record<string, unknown> = { deletedAt: null };
  if (query.status) where.status = query.status;
  if (query.priority) where.priority = query.priority;
  if (query.departmentId) where.departmentId = query.departmentId;

  // Role-scoped visibility
  if (actor.role === "CITIZEN") {
    where.citizenId = actor.id;
  } else if (actor.role === "STAFF") {
    const staff = await prisma.user.findUnique({ where: { id: actor.id } });
    where.departmentId = staff?.departmentId ?? "__none__";
  }

  const [items, total] = await prisma.$transaction([
    prisma.complaint.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [query.sortBy ?? "createdAt"]: query.sortOrder ?? "desc" },
      include: {
        department: { select: { id: true, name: true } },
        citizen: { select: { id: true, name: true, email: true } },
        assignedStaff: { select: { id: true, name: true } },
      },
    }),
    prisma.complaint.count({ where }),
  ]);

  return {
    items,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

export const searchComplaints = async (actor: AuthPayload, keyword: string) => {
  const where: Record<string, unknown> = {
    deletedAt: null,
    OR: [
      { title: { contains: keyword, mode: "insensitive" } },
      { description: { contains: keyword, mode: "insensitive" } },
      { category: { contains: keyword, mode: "insensitive" } },
    ],
  };
  if (actor.role === "CITIZEN") where.citizenId = actor.id;

  return prisma.complaint.findMany({ where, take: 20, orderBy: { createdAt: "desc" } });
};

export const getComplaintById = async (id: string, actor: AuthPayload) => {
  const complaint = await prisma.complaint.findFirst({
    where: { id, deletedAt: null },
    include: {
      department: true,
      citizen: { select: { id: true, name: true, email: true } },
      assignedStaff: { select: { id: true, name: true } },
      attachments: true,
      activity: {
        orderBy: { createdAt: "asc" },
        include: { actor: { select: { name: true, role: true } } },
      },
    },
  });
  if (!complaint) throw new AppError("Complaint not found", 404);

  if (actor.role === "CITIZEN" && complaint.citizenId !== actor.id) {
    throw new AppError("You do not have access to this complaint", 403);
  }
  return complaint;
};

export const assignComplaint = async (complaintId: string, staffId: string, actorId: string) => {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const complaint = await tx.complaint.findFirst({ where: { id: complaintId, deletedAt: null } });
    if (!complaint) throw new AppError("Complaint not found", 404);
    if (complaint.status !== "PENDING") {
      throw new AppError("Only pending complaints can be assigned", 400);
    }

    const staff = await tx.user.findFirst({
      where: {
        id: staffId,
        role: Role.STAFF,
        departmentId: complaint.departmentId,
        deletedAt: null,
      },
    });
    if (!staff) throw new AppError("Staff member not found in this department", 404);

    const updated = await tx.complaint.update({
      where: { id: complaintId },
      data: { assignedStaffId: staffId, status: "ASSIGNED" },
    });

    await tx.complaintActivity.create({
      data: {
        complaintId,
        actorId,
        fromStatus: "PENDING",
        toStatus: "ASSIGNED",
        note: `Assigned to ${staff.name}`,
      },
    });

    await notifyUser(tx, staffId, {
      title: "New complaint assigned",
      message: `You have been assigned complaint: ${complaint.title}`,
      type: "COMPLAINT_UPDATE",
    });

    return updated;
  });
};

export const updateComplaintStatus = async (
  complaintId: string,
  actor: AuthPayload,
  newStatus: ComplaintStatus,
  note?: string
) => {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const complaint = await tx.complaint.findFirst({ where: { id: complaintId, deletedAt: null } });
    if (!complaint) throw new AppError("Complaint not found", 404);

    if (actor.role === "STAFF" && complaint.assignedStaffId !== actor.id) {
      throw new AppError("You are not assigned to this complaint", 403);
    }

    const allowed = ALLOWED_TRANSITIONS[complaint.status];
    if (!allowed.includes(newStatus)) {
      throw new AppError(
        `Cannot transition complaint from ${complaint.status} to ${newStatus}`,
        400
      );
    }

    const updated = await tx.complaint.update({
      where: { id: complaintId },
      data: { status: newStatus },
    });

    await tx.complaintActivity.create({
      data: {
        complaintId,
        actorId: actor.id,
        fromStatus: complaint.status,
        toStatus: newStatus,
        note,
      },
    });

    await notifyUser(tx, complaint.citizenId, {
      title: "Complaint status updated",
      message: `Your complaint "${complaint.title}" is now ${newStatus}`,
      type: "COMPLAINT_UPDATE",
    });

    return updated;
  });
};

export const softDeleteComplaint = async (id: string) => {
  const complaint = await prisma.complaint.findFirst({ where: { id, deletedAt: null } });
  if (!complaint) throw new AppError("Complaint not found", 404);

  return prisma.complaint.update({ where: { id }, data: { deletedAt: new Date() } });
};

export const addAttachment = async (complaintId: string, url: string, publicId: string) => {
  const complaint = await prisma.complaint.findFirst({
    where: { id: complaintId, deletedAt: null },
  });
  if (!complaint) throw new AppError("Complaint not found", 404);

  return prisma.complaintAttachment.create({ data: { complaintId, url, publicId } });
};
