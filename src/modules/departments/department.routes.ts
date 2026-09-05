import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth";
import { validateRequest } from "../../middlewares/validateRequest";
import * as controller from "./department.controller";
import { createDepartmentSchema, updateDepartmentSchema } from "./department.validation";

const router = Router();

router.get("/", authenticate, controller.listDepartments);
router.get("/:id", authenticate, controller.getDepartment);
router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  validateRequest(createDepartmentSchema),
  controller.createDepartment
);
router.patch(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  validateRequest(updateDepartmentSchema),
  controller.updateDepartment
);
router.delete("/:id", authenticate, authorize("ADMIN"), controller.deleteDepartment);

export default router;
