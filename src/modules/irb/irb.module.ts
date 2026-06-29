import { Router } from "express";
import { requireAuth, requireRoles } from "../../common/auth.middleware.js";
import type { FeatureModule } from "../../common/router.js";
import { irbSections, irbSubmissions, persistDemoState } from "../../seed.js";
import type { IrbSubmission } from "../../types.js";

const router = Router();
router.use(requireAuth);

// Students read the coordinator-configured sections and submit filled pages.
router.get("/irb/sections", (_request, response) => response.json(irbSections));

// Coordinators/supervisors review submitted pages; coordinators can delete bad records.
router.get("/irb/submissions", requireRoles("coordinator", "supervisor"), (_request, response) => response.json(irbSubmissions));
router.post("/irb/submissions", (request, response) => {
  const section = irbSections.find((item) => item.id === request.body.sectionId);
  const submission: IrbSubmission = {
    id: `IRB-SUB-${Date.now().toString().slice(-5)}`,
    studentId: request.body.studentId,
    studentName: request.body.studentName,
    sectionId: request.body.sectionId,
    sectionTitle: section?.title || request.body.sectionTitle,
    status: request.body.status || "Submitted",
    values: request.body.values || {},
    submittedAt: new Date().toISOString(),
  };
  irbSubmissions.unshift(submission);
  persistDemoState();
  response.status(201).json(submission);
});
router.get("/irb/submissions/:id", (request, response) => {
  const submission = irbSubmissions.find((item) => item.id === String(request.params.id));
  if (!submission) return response.status(404).json({ error: "IRB submission not found" });
  return response.json(submission);
});
router.patch("/irb/submissions/:id/review", requireRoles("coordinator", "supervisor"), (request, response) => {
  const submission = irbSubmissions.find((item) => item.id === String(request.params.id));
  if (!submission) return response.status(404).json({ error: "IRB submission not found" });
  submission.status = request.body.status || submission.status;
  persistDemoState();
  return response.json(submission);
});
router.delete("/irb/submissions/:id", requireRoles("coordinator"), (request, response) => {
  const index = irbSubmissions.findIndex((item) => item.id === String(request.params.id));
  if (index < 0) return response.status(404).json({ error: "IRB submission not found" });
  const [removed] = irbSubmissions.splice(index, 1);
  persistDemoState();
  return response.json(removed);
});

export const IrbModule: FeatureModule = {
  basePath: "/api/v1",
  router,
};
