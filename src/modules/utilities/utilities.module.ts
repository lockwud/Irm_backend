import { Router } from "express";
import { requireAuth, requireRoles } from "../../common/auth.middleware.js";
import type { FeatureModule } from "../../common/router.js";
import { auditLogs, workflow } from "../../seed.js";
import { supportTickets } from "../support/support.store.js";
import { persistState, readState } from "../../database/state-store.js";

const router = Router();
router.use(requireAuth);
const generatedReports = [
  { id: "RPT-001", name: "Programme dashboard", type: "PDF", status: "Ready", generatedAt: "2026-06-24T09:00:00.000Z" },
  { id: "RPT-002", name: "Supervisor workload", type: "Excel", status: "Ready", generatedAt: "2026-06-24T09:15:00.000Z" },
];

export async function hydrateReportsFromPostgres() {
  const saved = await readState<typeof generatedReports>("sip.generated-reports");
  if (Array.isArray(saved)) generatedReports.splice(0, generatedReports.length, ...saved);
  else await persistState("sip.generated-reports", generatedReports);
}

function persistReports() {
  persistState("sip.generated-reports", generatedReports);
}

function periodKey(value: unknown) {
  const raw = String(value || "this-week").toLowerCase();
  if (raw.includes("today")) return "today";
  if (raw.includes("month")) return "this-month";
  if (raw.includes("all")) return "all-time";
  return "this-week";
}

function periodScale(period: string) {
  return period === "today" ? 0.35 : period === "this-week" ? 0.65 : period === "this-month" ? 0.85 : 1;
}

function scaled(value: number, period: string, minimum = 0) {
  if (value <= 0) return 0;
  return Math.max(minimum, Math.round(value * periodScale(period)));
}

function scaledSeries(series: number[], period: string) {
  const scale = periodScale(period);
  return series.map((value, index) => Math.min(100, Math.round(value * scale + index * (period === "today" ? 1.5 : 0))));
}

router.get("/me", (request, response) => response.json(request.user));
router.get("/dashboard/summary", (_request, response) => response.json({
  students: workflow.students.length,
  placements: workflow.placements.length,
  pendingPlacements: workflow.placements.filter((item) => item.status === "Pending").length,
  lessonNotes: workflow.notes.length,
  visits: workflow.visits.length,
}));
router.get("/dashboard/coordinator", requireRoles("coordinator"), (request, response) => {
  const period = periodKey(request.query.period);
  const activePlacements = workflow.placements.filter((item) => item.status === "Approved").length;
  const pendingApprovals = workflow.placements.filter((item) => item.status === "Pending").length;
  const completed = workflow.students.filter((item) => item.status === "Completed").length;
  const activeStudents = workflow.students.filter((item) => item.status === "Active").length;
  const baseSeries = [32, 44, 38, 57, 54, 69, 62, 75, 67, 80, 73, 84];
  response.json({
    period,
    kpis: {
      totalInterns: scaled(workflow.students.length, period, 1),
      activePlacements: scaled(activePlacements, period, 1),
      pendingApprovals: scaled(pendingApprovals, period, period === "today" ? 0 : 1),
      completedSip: scaled(completed, period, period === "all-time" ? 1 : 0),
      openSupportTickets: supportTickets.filter((item) => item.status !== "Resolved").length,
    },
    progress: {
      activeInterns: scaled(activeStudents, period, 1),
      change: period === "today" ? "2.1%" : period === "this-week" ? "8.2%" : period === "this-month" ? "11.4%" : "18.6%",
      series: scaledSeries(baseSeries, period),
    },
    placementOverview: {
      total: scaled(workflow.students.length, period, 1),
      active: scaled(activePlacements, period, 1),
      pending: scaled(pendingApprovals, period, period === "today" ? 0 : 1),
      completed: scaled(completed, period, period === "all-time" ? 1 : 0),
    },
    recentActivity: workflow.notifications.slice(0, period === "today" ? 2 : 4),
    upcomingVisits: workflow.visits.filter((item) => item.status === "Scheduled" || item.status === "Rescheduled").slice(0, period === "today" ? 1 : 3),
  });
});
router.get("/dashboard/supervisor", requireRoles("supervisor", "coordinator"), (request, response) => {
  const period = periodKey(request.query.period);
  const supervisorName = request.user?.name || "Dr. Samuel Ofori";
  const assignedPlacements = workflow.placements.filter((item) => item.status === "Approved" && (item.supervisor.includes("Ofori") || item.supervisor.includes(supervisorName) || item.supervisor === "Dr. S. Ofori"));
  const assignedNames = new Set(assignedPlacements.map((item) => item.student));
  const notes = workflow.notes.filter((item) => assignedNames.has(item.student));
  const visits = workflow.visits.filter((item) => assignedNames.has(item.student) || item.supervisor.includes("Ofori") || item.supervisor.includes(supervisorName));
  response.json({
    period,
    kpis: {
      assignedInterns: scaled(assignedPlacements.length, period, 1),
      pendingReviews: scaled(notes.filter((item) => item.supervisor === "Pending").length, period, period === "today" ? 0 : 1),
      upcomingVisits: scaled(visits.filter((item) => item.status === "Scheduled" || item.status === "Rescheduled").length, period, period === "today" ? 0 : 1),
      averageIrbProgress: assignedPlacements.length ? scaled(67, period, 20) : 0,
      completedVisits: scaled(visits.filter((item) => item.status === "Completed").length, period, period === "all-time" ? 1 : 0),
    },
    assignedInterns: assignedPlacements.slice(0, scaled(assignedPlacements.length, period, 1)).map((placement, index) => ({
      id: workflow.students.find((student) => student.name === placement.student)?.id || placement.id,
      name: placement.student,
      school: placement.school,
      region: placement.region,
      irb: scaled([72, 61, 83, 55][index % 4], period, 20),
    })),
    pendingLessonReviews: notes.filter((item) => item.supervisor === "Pending"),
  });
});
router.get("/dashboard/student", requireRoles("student", "coordinator"), (request, response) => {
  const period = periodKey(request.query.period);
  const userIdentifier = String(request.user?.identifier || "").trim().toLowerCase().replace("@st.ammusted.edu.gh", "@st.aamusted.edu.gh");
  const userName = request.user?.name || "Kwame Mensah";
  const student =
    workflow.students.find((item) => item.email.toLowerCase().replace("@st.ammusted.edu.gh", "@st.aamusted.edu.gh") === userIdentifier || item.id === request.user?.identifier || item.name === userName) ||
    workflow.students[0];
  const placements = workflow.placements.filter((item) => item.student === student.name);
  const notes = workflow.notes.filter((item) => item.student === student.name);
  const visits = workflow.visits.filter((item) => item.student === student.name);
  const approvedPlacement = placements.find((item) => item.status === "Approved");
  const pendingPlacement = placements.find((item) => item.status === "Pending");
  const baseProgress = approvedPlacement ? 68 : pendingPlacement ? 32 : 18;
  response.json({
    period,
    student,
    kpis: {
      progress: scaled(baseProgress, period, 8),
      placement: approvedPlacement || pendingPlacement || null,
      irbProgress: approvedPlacement ? `${period === "today" ? 1 : period === "this-week" ? 3 : 4} of 6 sections` : "0 of 6 sections",
      approvedLessonNotes: scaled(notes.filter((item) => item.supervisor === "Approved").length, period, period === "all-time" ? 1 : 0),
      pendingLessonNotes: scaled(notes.filter((item) => item.supervisor === "Pending").length, period, period === "today" ? 0 : 1),
      nextVisit: period === "all-time" ? visits[0] || null : visits.find((item) => item.status === "Scheduled" || item.status === "Rescheduled") || null,
    },
  });
});
router.get("/audit-logs", requireRoles("coordinator"), (_request, response) => response.json(auditLogs));
router.post("/bulk-uploads", requireRoles("coordinator"), (request, response) => response.status(201).json({ id: `BULK-${Date.now().toString().slice(-5)}`, status: "Processed", summary: request.body }));
router.get("/reports", requireRoles("coordinator"), (_request, response) => response.json(generatedReports));
router.post("/reports/generate", requireRoles("coordinator"), (request, response) => {
  const report = { id: `RPT-${Date.now().toString().slice(-5)}`, name: request.body.name || "Programme report", type: request.body.type || "PDF", status: "Ready", generatedAt: new Date().toISOString() };
  generatedReports.unshift(report);
  persistReports();
  response.status(201).json(report);
});

export const UtilitiesModule: FeatureModule = {
  basePath: "/api/v1",
  router,
};
