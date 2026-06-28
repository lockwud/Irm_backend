import { Router } from "express";
import { requireAuth, requireRoles } from "../../common/auth.middleware.js";
import type { FeatureModule } from "../../common/router.js";
import { schoolSuggestions, schools, staffMembers, supervisorAssignments, workflow } from "../../seed.js";
import { ghanaLocations } from "../../data/ghana-locations.js";
import type { School, SupervisorAssignment } from "../../types.js";

const router = Router();
router.use(requireAuth);

// Ghana location directory: used by every Region → Municipality/District → Community dropdown.
router.get("/locations/ghana", (_request, response) => response.json(ghanaLocations));

// School directory: supports approved government, mission/private, SHS, primary/JHS and TVET schools.
// Query filters keep large future imports searchable without changing the UI.
router.get("/schools", (request, response) => {
  const { region, municipality, community, category, ownership, q } = request.query;
  const search = String(q || "").toLowerCase();
  const records = schools.filter((school) =>
    (!region || school.region === String(region)) &&
    (!municipality || school.municipality === String(municipality)) &&
    (!community || school.community === String(community)) &&
    (!category || school.category === String(category)) &&
    (!ownership || school.ownership === String(ownership)) &&
    (!search || [school.name, school.region, school.municipality, school.community, school.category, school.ownership || ""].join(" ").toLowerCase().includes(search))
  );
  response.json(records);
});
router.post("/schools", requireRoles("coordinator"), (request, response) => {
  const school: School = { id: `SCH-${Date.now().toString().slice(-5)}`, status: "Active", interns: 0, capacity: 20, ...request.body };
  schools.unshift(school);
  response.status(201).json(school);
});

// Student “school not found” flow: students suggest a school; coordinators approve it
// before it becomes part of the official selectable partner-school directory.
router.post("/schools/suggestions", (request, response) => {
  const suggestion = { id: `SCH-SUG-${Date.now().toString().slice(-5)}`, status: "Pending" as const, school: request.body, createdAt: new Date().toISOString() };
  schoolSuggestions.unshift(suggestion);
  response.status(201).json(suggestion);
});
router.get("/schools/suggestions", requireRoles("coordinator"), (_request, response) => response.json(schoolSuggestions));
router.patch("/schools/suggestions/:id", requireRoles("coordinator"), (request, response) => {
  const index = schoolSuggestions.findIndex((item) => item.id === String(request.params.id));
  if (index < 0) return response.status(404).json({ error: "School suggestion not found" });
  schoolSuggestions[index] = { ...schoolSuggestions[index], status: request.body.status || schoolSuggestions[index].status };
  if (schoolSuggestions[index].status === "Approved") {
    const school: School = { id: `SCH-${Date.now().toString().slice(-5)}`, name: String(schoolSuggestions[index].school.name), region: String(schoolSuggestions[index].school.region), municipality: String(schoolSuggestions[index].school.municipality), community: String(schoolSuggestions[index].school.community), category: String(schoolSuggestions[index].school.category || "Basic"), ownership: "Government", interns: 0, capacity: 20, status: "Active" };
    schools.unshift(school);
  }
  return response.json(schoolSuggestions[index]);
});
router.get("/schools/:id", (request, response) => {
  const school = schools.find((item) => item.id === String(request.params.id));
  if (!school) return response.status(404).json({ error: "School not found" });
  return response.json(school);
});
router.patch("/schools/:id", requireRoles("coordinator"), (request, response) => {
  const index = schools.findIndex((item) => item.id === String(request.params.id));
  if (index < 0) return response.status(404).json({ error: "School not found" });
  schools[index] = { ...schools[index], ...request.body };
  return response.json(schools[index]);
});
router.delete("/schools/:id", requireRoles("coordinator"), (request, response) => {
  const index = schools.findIndex((item) => item.id === String(request.params.id));
  if (index < 0) return response.status(404).json({ error: "School not found" });
  const [removed] = schools.splice(index, 1);
  return response.json(removed);
});

router.get("/staff", requireRoles("coordinator"), (_request, response) => response.json(staffMembers));
router.get("/supervisors", (_request, response) => response.json(staffMembers.filter((item) => item.role === "supervisor")));
router.post("/supervisors", requireRoles("coordinator"), (request, response) => {
  const supervisor = { id: `STF-${Date.now().toString().slice(-5)}`, role: "supervisor" as const, status: "Active" as const, regions: [], ...request.body };
  staffMembers.unshift(supervisor);
  response.status(201).json(supervisor);
});
router.get("/supervisor-assignments", requireRoles("coordinator", "supervisor"), (_request, response) => response.json(supervisorAssignments));
router.post("/supervisor-assignments", requireRoles("coordinator"), (request, response) => {
  const supervisor = staffMembers.find((item) => item.id === request.body.supervisorId || item.staffId === request.body.staffId);
  const assignment: SupervisorAssignment = {
    id: `SUP-ASG-${Date.now().toString().slice(-5)}`,
    supervisorId: supervisor?.id || request.body.supervisorId,
    supervisorName: supervisor?.name || request.body.supervisorName,
    staffId: supervisor?.staffId || request.body.staffId,
    regions: request.body.regions || supervisor?.regions || [],
    internIds: request.body.internIds || [],
    capacity: Number(request.body.capacity || 25),
    completedVisits: Number(request.body.completedVisits || 0),
    status: "Active",
  };
  supervisorAssignments.unshift(assignment);
  response.status(201).json(assignment);
});
router.patch("/supervisor-assignments/:id", requireRoles("coordinator"), (request, response) => {
  const index = supervisorAssignments.findIndex((item) => item.id === String(request.params.id));
  if (index < 0) return response.status(404).json({ error: "Assignment not found" });
  supervisorAssignments[index] = { ...supervisorAssignments[index], ...request.body };
  return response.json(supervisorAssignments[index]);
});
router.post("/placements/:id/assign-supervisor", requireRoles("coordinator"), (request, response) => {
  const placement = workflow.placements.find((item) => item.id === String(request.params.id));
  if (!placement) return response.status(404).json({ error: "Placement not found" });
  placement.supervisor = request.body.supervisorName || request.body.supervisor || "Unassigned";
  return response.json(placement);
});

export const DirectoryModule: FeatureModule = {
  basePath: "/api/v1",
  router,
};
