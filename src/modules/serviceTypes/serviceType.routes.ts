import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth";
import { validateRequest } from "../../middlewares/validateRequest";
import * as controller from "./serviceType.controller";
import { createServiceTypeSchema } from "./serviceType.validation";

const router = Router();

router.get("/", authenticate, controller.listServiceTypes);
router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  validateRequest(createServiceTypeSchema),
  controller.createServiceType
);
router.delete("/:id", authenticate, authorize("ADMIN"), controller.deleteServiceType);

export default router;
