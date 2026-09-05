import { Router } from "express";
import { authLimiter } from "../../middlewares/rateLimiter";
import { validateRequest } from "../../middlewares/validateRequest";
import * as controller from "./auth.controller";
import { loginSchema, refreshSchema, registerSchema } from "./auth.validation";

const router = Router();

router.post("/register", authLimiter, validateRequest(registerSchema), controller.register);
router.post("/login", authLimiter, validateRequest(loginSchema), controller.login);
router.post("/refresh-token", validateRequest(refreshSchema), controller.refreshToken);
router.post("/logout", validateRequest(refreshSchema), controller.logout);

// GCP Social Login
router.get("/google", controller.googleRedirect);
router.get("/google/callback", controller.googleCallback);

export default router;
