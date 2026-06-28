import { Router } from "express";
import type { FeatureModule } from "../../common/router.js";
import { persistDemoState, staffMembers, workflow } from "../../seed.js";
import type { StaffMember, Student } from "../../types.js";
import { provisionStaffAccount, provisionStudentAccount } from "../auth/auth.service.js";

const router = Router();

router.post("/students/register", (request, response) => {
  const student: Student = {
    id: request.body.studentId || request.body.id || `52${Date.now().toString().slice(-8)}`,
    name: request.body.name,
    email: request.body.email,
    programme: request.body.programme || "B.Ed. Programme",
    department: request.body.department || "Education",
    year: Number(request.body.year || 4),
    school: request.body.school || "—",
    region: request.body.region || "Ashanti",
    status: "Pending",
  };
  workflow.students.unshift(student);
  const account = provisionStudentAccount(student);
  persistDemoState();
  response.status(201).json({ ...student, account });
});

router.post("/staff/register", (request, response) => {
  const member: StaffMember = {
    id: `STF-${Date.now().toString().slice(-5)}`,
    name: request.body.name,
    email: request.body.email,
    staffId: request.body.staffId || `STA-${Date.now().toString().slice(-4)}`,
    role: request.body.role || "supervisor",
    regions: request.body.regions || [],
    status: "Pending",
  };
  staffMembers.unshift(member);
  const account = provisionStaffAccount(member);
  persistDemoState();
  response.status(201).json({ ...member, account });
});

export const RegistrationModule: FeatureModule = {
  basePath: "/api/v1",
  router,
};
