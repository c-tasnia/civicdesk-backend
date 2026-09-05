import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth";
import { validateRequest } from "../../middlewares/validateRequest";
import * as controller from "./serviceRequest.controller";
import {
  createServiceRequestSchema,
  updateServiceRequestStatusSchema,
} from "./serviceRequest.validation";

const router = Router();

router.use(authenticate);
router.post(
  "/",
  authorize("CITIZEN"),
  validateRequest(createServiceRequestSchema),
  controller.createServiceRequest
);
router.get("/", controller.listServiceRequests);
router.get("/:id", controller.getServiceRequest);
router.patch(
  "/:id/status",
  authorize("STAFF", "ADMIN"),
  validateRequest(updateServiceRequestStatusSchema),
  controller.updateStatus
);

export default router;
