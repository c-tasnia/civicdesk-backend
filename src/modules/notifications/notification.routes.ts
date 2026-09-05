import { Router } from "express";
import { authenticate } from "../../middlewares/auth";
import * as controller from "./notification.controller";

const router = Router();

router.use(authenticate);
router.get("/", controller.listNotifications);
router.patch("/:id/read", controller.markRead);
router.patch("/read-all", controller.markAllRead);

export default router;
