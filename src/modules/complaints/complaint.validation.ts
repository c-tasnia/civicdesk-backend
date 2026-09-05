import { z } from "zod";

export const createComplaintSchema = z.object({
  body: z.object({
    departmentId: z.string().uuid("Invalid department id"),
    category: z.string().min(2),
    title: z.string().min(5),
    description: z.string().min(10),
    location: z.string().min(3),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  }),
});

export const listComplaintsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    status: z
      .enum(["PENDING", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "REJECTED", "CLOSED"])
      .optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
    departmentId: z.string().uuid().optional(),
    sortBy: z.enum(["createdAt", "priority", "status"]).optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
  }),
});

export const assignComplaintSchema = z.object({
  body: z.object({
    staffId: z.string().uuid("Invalid staff id"),
  }),
});

export const updateStatusSchema = z.object({
  body: z.object({
    status: z.enum(["ASSIGNED", "IN_PROGRESS", "RESOLVED", "REJECTED", "CLOSED"]),
    note: z.string().optional(),
  }),
});
