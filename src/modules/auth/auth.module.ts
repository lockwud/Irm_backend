import { Router } from "express";
import type { FeatureModule } from "../../common/router.js";
import { requireAuth } from "../../common/auth.middleware.js";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";

const service = new AuthService();
const controller = new AuthController(service);
const router = Router();

router.post("/login", controller.login);
router.post("/change-password", requireAuth, controller.changePassword);

export const AuthModule: FeatureModule = {
  basePath: "/api/v1/auth",
  router,
};
