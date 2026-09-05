import { z } from "zod";

export const createServiceRequestSchema = z.object({
  body: z.object({
    serviceTypeId: z.string().uuid(),
    note: z.string().optional(),
  }),
});

export const updateServiceRequestStatusSchema = z.object({
  body: z.object({
    status: z.enum(["PROCESSING", "APPROVED", "REJECTED", "COMPLETED"]),
  }),
});
