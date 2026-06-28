import { Router } from "express";
import { requireAuth, requireRoles } from "../../common/auth.middleware.js";
import type { FeatureModule } from "../../common/router.js";
import { WorkflowService } from "../workflow/workflow.service.js";
import { StaffController } from "./staff.controller.js";
import { StaffService } from "./staff.service.js";

const service = new StaffService(new WorkflowService());
const controller = new StaffController(service);
const router = Router();

router.use(requireAuth, requireRoles("coordinator"));

router.get("/invitations", controller.invitations);
router.post("/invitations", controller.createInvitation);
router.post("/invitations/:id/revoke", controller.revokeInvitation);

export const StaffModule: FeatureModule = {
  basePath: "/api/v1/staff",
  router,
};
