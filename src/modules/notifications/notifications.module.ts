import { Router } from "express";
import { requireAuth } from "../../common/auth.middleware.js";
import type { FeatureModule } from "../../common/router.js";
import { NotificationsController } from "./notifications.controller.js";
import { NotificationsService } from "./notifications.service.js";

const service = new NotificationsService();
const controller = new NotificationsController(service);
const router = Router();

router.use(requireAuth);

router.get("/", controller.list);
router.post("/device", controller.registerDevice);
router.patch("/read-all", controller.markAllRead);

export const NotificationsModule: FeatureModule = {
  basePath: "/api/v1/notifications",
  router,
};
