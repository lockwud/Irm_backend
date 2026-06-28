import { Router } from "express";
import { requireAuth } from "../../common/auth.middleware.js";
import type { FeatureModule } from "../../common/router.js";
import { WorkflowController } from "./workflow.controller.js";
import { WorkflowService } from "./workflow.service.js";

const service = new WorkflowService();
const controller = new WorkflowController(service);
const router = Router();

router.use(requireAuth);

router.get("/workflow", controller.getWorkflow);
router.put("/workflow", controller.updateWorkflow);

router.get("/students", controller.getStudents);
router.post("/students", controller.createStudent);

router.get("/placements", controller.getPlacements);
router.post("/placements", controller.createPlacement);
router.post("/placements/:id/approve", controller.approvePlacement);
router.post("/placements/:id/reject", controller.rejectPlacement);

router.get("/lesson-notes", controller.getLessonNotes);
router.post("/lesson-notes", controller.createLessonNote);
router.post("/lesson-notes/:id/supervisor-review", controller.reviewLessonNote);

router.get("/visits", controller.getVisits);
router.post("/visits", controller.createVisit);
router.post("/visits/:id/reschedule", controller.rescheduleVisit);
router.post("/visits/:id/complete", controller.completeVisit);

export const WorkflowModule: FeatureModule = {
  basePath: "/api/v1",
  router,
};
