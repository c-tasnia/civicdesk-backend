import { Router } from "express";
import { authenticate } from "../../middlewares/auth";
import * as controller from "./payment.controller";

const router = Router();

// Gateway-initiated callbacks (no user JWT — SSLCommerz calls these directly)
router.post("/success", controller.paymentSuccess);
router.post("/fail", controller.paymentFail);
router.post("/cancel", controller.paymentCancel);
router.post("/webhook", controller.paymentWebhook);

router.post("/initiate", authenticate, controller.initiatePayment);
router.get("/:id", authenticate, controller.getPayment);

export default router;
