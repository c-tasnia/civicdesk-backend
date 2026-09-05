import { Router } from "express";
import adminRoutes from "../modules/admin/admin.routes";
import authRoutes from "../modules/auth/auth.routes";
import complaintRoutes from "../modules/complaints/complaint.routes";
import departmentRoutes from "../modules/departments/department.routes";
import notificationRoutes from "../modules/notifications/notification.routes";
import paymentRoutes from "../modules/payments/payment.routes";
import serviceRequestRoutes from "../modules/serviceRequests/serviceRequest.routes";
import serviceTypeRoutes from "../modules/serviceTypes/serviceType.routes";
import userRoutes from "../modules/users/user.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/departments", departmentRoutes);
router.use("/complaints", complaintRoutes);
router.use("/service-types", serviceTypeRoutes);
router.use("/service-requests", serviceRequestRoutes);
router.use("/payments", paymentRoutes);
router.use("/notifications", notificationRoutes);
router.use("/admin", adminRoutes);

export default router;
