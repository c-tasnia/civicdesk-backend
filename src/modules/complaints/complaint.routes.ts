import { Router } from "express";
import { upload } from "../../config/cloudinary";
import { authenticate, authorize } from "../../middlewares/auth";
import { validateRequest } from "../../middlewares/validateRequest";
import * as controller from "./complaint.controller";
import {
  assignComplaintSchema,
  createComplaintSchema,
  listComplaintsSchema,
  updateStatusSchema,
} from "./complaint.validation";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  authorize("CITIZEN"),
  validateRequest(createComplaintSchema),
  controller.createComplaint
);
router.get("/", validateRequest(listComplaintsSchema), controller.listComplaints);
router.get("/search", controller.searchComplaints);
router.get("/:id", controller.getComplaint);
router.patch(
  "/:id/assign",
  authorize("STAFF", "ADMIN"),
  validateRequest(assignComplaintSchema),
  controller.assignComplaint
);
router.patch(
  "/:id/status",
  authorize("STAFF", "ADMIN"),
  validateRequest(updateStatusSchema),
  controller.updateStatus
);
router.delete("/:id", authorize("ADMIN"), controller.deleteComplaint);
router.post("/:id/attachments", upload.single("file"), controller.uploadAttachment);

export default router;
