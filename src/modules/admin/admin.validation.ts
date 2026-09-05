import { z } from "zod";

export const updateUserRoleSchema = z.object({
  body: z.object({
    role: z.enum(["CITIZEN", "STAFF", "ADMIN"]),
    departmentId: z.string().uuid().optional(),
  }),
});
