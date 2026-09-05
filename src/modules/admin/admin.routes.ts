import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth";
import { validateRequest } from "../../middlewares/validateRequest";
import * as controller from "./admin.controller";
import { updateUserRoleSchema } from "./admin.validation";

const router = Router();

router.use(authenticate, authorize("ADMIN"));

router.get("/users", controller.listUsers);
router.patch("/users/:id/role", validateRequest(updateUserRoleSchema), controller.updateUserRole);
router.delete("/users/:id", controller.deleteUser);
router.get("/dashboard-stats", controller.dashboardStats);
router.get("/audit-logs", controller.listAuditLogs);

export default router;
