import { Router } from "express";
import { requireAuth, requireRoles } from "../../common/auth.middleware.js";
import type { FeatureModule } from "../../common/router.js";
import { irbSections, lessonNoteFormat } from "../../seed.js";

const router = Router();
router.use(requireAuth, requireRoles("coordinator"));

const programmeSettings = {
  programmeName: "Student Internship Programme",
  supportEmail: "cstsi@aamusted.edu.gh",
  defaultRegion: "Ashanti",
  institution: "AAMUSTED",
  academicYear: "2025/2026",
  cohortName: "Final Year Internship",
  programmeStart: "2026-02-02",
  programmeEnd: "2026-08-28",
  studentSelfPlacement: true,
  showPlacementCapacity: true,
  acceptNewPlacements: true,
  placementNotifications: true,
  lessonNoteNotifications: true,
  visitReminders: true,
  deadlineAlerts: true,
  sessionDuration: "8 hours",
  failedSignInLimit: "5 attempts",
  strongPasswords: true,
  coordinatorSignInAlerts: true,
  emailSenderName: "AAMUSTED SIP Portal",
  emailReplyTo: "sip@aamusted.edu.gh",
  emailFooter: "Student Internship Programme · AAMUSTED",
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID || "",
  firebaseVapidKey: process.env.FIREBASE_VAPID_KEY || "",
  fcmPlacementConfirmations: true,
  fcmVisitReminders: true,
};

// Programme settings used by coordinator administration screens.
router.get("/settings", (_request, response) => response.json(programmeSettings));
router.patch("/settings", (request, response) => {
  Object.assign(programmeSettings, request.body);
  response.json(programmeSettings);
});

// IRB template configuration: coordinator defines fields; students fill the live version.
router.get("/configurations/irb-template", (_request, response) => response.json(irbSections));
router.put("/configurations/irb-template", (request, response) => {
  irbSections.splice(0, irbSections.length, ...(Array.isArray(request.body) ? request.body : request.body.sections));
  response.json(irbSections);
});
router.post("/configurations/irb-template/sections", (request, response) => {
  const section = { id: `IRB-${Date.now().toString().slice(-4)}`, fixed: false, fields: [], ...request.body };
  irbSections.push(section);
  response.status(201).json(section);
});
router.patch("/configurations/irb-template/sections/:id", (request, response) => {
  const index = irbSections.findIndex((item) => item.id === String(request.params.id));
  if (index < 0) return response.status(404).json({ error: "IRB section not found" });
  irbSections[index] = { ...irbSections[index], ...request.body };
  return response.json(irbSections[index]);
});
router.delete("/configurations/irb-template/sections/:id", (request, response) => {
  const index = irbSections.findIndex((item) => item.id === String(request.params.id));
  if (index < 0) return response.status(404).json({ error: "IRB section not found" });
  const [removed] = irbSections.splice(index, 1);
  return response.json(removed);
});

// Lesson-note format configuration: controls the planner fields/font/table layout.
router.get("/configurations/lesson-note-format", (_request, response) => response.json(lessonNoteFormat));
router.put("/configurations/lesson-note-format", (request, response) => {
  Object.assign(lessonNoteFormat, request.body);
  response.json(lessonNoteFormat);
});

export const ConfigurationsModule: FeatureModule = {
  basePath: "/api/v1",
  router,
};
