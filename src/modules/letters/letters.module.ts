import { Router } from "express";
import { requireAuth, requireRoles } from "../../common/auth.middleware.js";
import type { FeatureModule } from "../../common/router.js";
import { internshipLetterTemplate, workflow } from "../../seed.js";

const router = Router();
router.use(requireAuth);

router.get("/internship-letter/template", (_request, response) => response.json(internshipLetterTemplate));
router.put("/internship-letter/template", requireRoles("coordinator"), (request, response) => {
  Object.assign(internshipLetterTemplate, request.body);
  response.json(internshipLetterTemplate);
});
router.post("/internship-letter/generate", (request, response) => {
  const student = workflow.students.find((item) => item.id === request.body.studentId || item.name === request.body.studentName);
  const placement = workflow.placements.find((item) => item.student === student?.name && item.status === "Approved");
  response.json({
    id: `LETTER-${Date.now().toString().slice(-5)}`,
    student,
    placement,
    template: internshipLetterTemplate,
    generatedAt: new Date().toISOString(),
    downloadUrl: `/api/v1/internship-letter/download/${student?.id || "preview"}`,
  });
});
router.get("/internship-letter/download/:studentId", (request, response) => {
  const student = workflow.students.find((item) => item.id === String(request.params.studentId));
  response.type("text/plain").send(`${internshipLetterTemplate.letterheadName}\n\n${internshipLetterTemplate.title}\n\n${internshipLetterTemplate.body.replace("{{student_name}}", student?.name || "Student").replace("{{student_id}}", student?.id || "Student ID")}`);
});

export const LettersModule: FeatureModule = {
  basePath: "/api/v1",
  router,
};
