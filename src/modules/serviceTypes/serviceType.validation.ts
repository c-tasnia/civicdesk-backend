import { z } from "zod";

export const createServiceTypeSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    description: z.string().optional(),
    fee: z.number().positive("Fee must be greater than 0"),
    departmentId: z.string().uuid(),
  }),
});
