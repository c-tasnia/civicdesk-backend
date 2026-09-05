import { Router } from "express";
import { authenticate } from "../../middlewares/auth";
import { validateRequest } from "../../middlewares/validateRequest";
import * as controller from "./user.controller";
import { updateProfileSchema } from "./user.validation";

const router = Router();

router.use(authenticate);
router.get("/me", controller.getMe);
router.patch("/me", validateRequest(updateProfileSchema), controller.updateMe);

export default router;
