import { randomUUID } from "node:crypto";
import { persistDemoState, workflow } from "../../seed.js";
import type { AuthenticatedUser } from "../../common/auth.middleware.js";
import type { NotificationItem, WorkflowData } from "../../types.js";
import { provisionStudentAccount } from "../auth/auth.service.js";

export class WorkflowService {
  // This seed-backed service behaves like a repository for the demo.
  // When PostgreSQL/Prisma is connected, each method can be replaced with a DB call
  // without changing the controller routes or the frontend API contract.
  getWorkflow(user?: AuthenticatedUser) {
    return this.scopeWorkflow(user);
  }

  updateWorkflow(next: Partial<WorkflowData>, user?: AuthenticatedUser) {
    if (user?.role === "student") {
      const student = this.currentStudent(user);
      if (!student) return this.scopeWorkflow(user);
      if (Array.isArray(next.placements)) this.mergeOwned("placements", next.placements, (item) => item.student === student.name);
      if (Array.isArray(next.notes)) this.mergeOwned("notes", next.notes, (item) => item.student === student.name);
      if (Array.isArray(next.visits)) this.mergeOwned("visits", next.visits, (item) => item.student === student.name);
      if (Array.isArray(next.notifications)) this.mergeOwned("notifications", next.notifications, (item) => item.message.includes(student.name) || item.title.includes("Student support"));
      persistDemoState();
      return this.scopeWorkflow(user);
    }
    if (user?.role === "supervisor") {
      const names = this.supervisorStudentNames(user);
      if (Array.isArray(next.notes)) this.mergeOwned("notes", next.notes, (item) => names.has(item.student));
      if (Array.isArray(next.visits)) this.mergeOwned("visits", next.visits, (item) => names.has(item.student) || item.supervisor.includes(user.name));
      if (Array.isArray(next.notifications)) this.mergeOwned("notifications", next.notifications, (item) => names.has(this.studentNameFromMessage(item.message)) || item.message.includes(user.name));
      persistDemoState();
      return this.scopeWorkflow(user);
    }
    // Merge only known arrays so malformed payloads cannot replace unrelated state.
    if (Array.isArray(next.students)) workflow.students = next.students;
    if (Array.isArray(next.placements)) workflow.placements = next.placements;
    if (Array.isArray(next.notes)) workflow.notes = next.notes;
    if (Array.isArray(next.visits)) workflow.visits = next.visits;
    if (Array.isArray(next.notifications)) workflow.notifications = next.notifications;
    persistDemoState();
    return this.scopeWorkflow(user);
  }

  addNotification(title: string, message: string, type: string): NotificationItem {
    // Every important action creates a notification so the dashboards/drawers
    // reflect changes across coordinator, supervisor and student roles.
    const notification = { id: randomUUID(), title, message, type, read: false, time: "Just now" };
    workflow.notifications.unshift(notification);
    persistDemoState();
    return notification;
  }

  students(user?: AuthenticatedUser) {
    return this.scopeWorkflow(user).students;
  }

  createStudent(student: WorkflowData["students"][number]) {
    workflow.students.unshift(student);
    const account = provisionStudentAccount(student);
    this.addNotification("Student added", `${student.name} was added to the SIP cohort.`, "system");
    persistDemoState();
    return { ...student, account };
  }

  placements(user?: AuthenticatedUser) {
    return this.scopeWorkflow(user).placements;
  }

  createPlacement(input: Partial<WorkflowData["placements"][number]>) {
    // Placement requests can come from the student portal or coordinator portal.
    // They start pending until the coordinator approves/rejects them.
    const placement = { ...input, id: input.id || `PL-${Date.now().toString().slice(-4)}`, status: input.status || "Pending" } as WorkflowData["placements"][number];
    workflow.placements.unshift(placement);
    this.addNotification("Placement created", `${placement.student} requested ${placement.school}.`, "placement");
    persistDemoState();
    return placement;
  }

  decidePlacement(id: string, status: "Approved" | "Rejected", supervisor?: string) {
    const placement = workflow.placements.find((item) => item.id === id);
    if (!placement) return null;
    placement.status = status;
    if (supervisor) placement.supervisor = supervisor;
    this.addNotification(`Placement ${status.toLowerCase()}`, `${placement.student}'s placement at ${placement.school} was ${status.toLowerCase()}.`, "placement");
    persistDemoState();
    return placement;
  }

  lessonNotes(user?: AuthenticatedUser) {
    return this.scopeWorkflow(user).notes;
  }

  createLessonNote(input: Partial<WorkflowData["notes"][number]>) {
    const note = { ...input, id: input.id || `LN-${Date.now().toString().slice(-3)}`, mentor: "Pending", supervisor: "Pending" } as WorkflowData["notes"][number];
    workflow.notes.unshift(note);
    this.addNotification("Lesson note submitted", `${note.student} submitted ${note.subject}.`, "lesson");
    persistDemoState();
    return note;
  }

  reviewLessonNote(id: string, status: "Approved" | "Revision") {
    // Supervisors review after mentor review and can approve or request revision.
    const note = workflow.notes.find((item) => item.id === id);
    if (!note) return null;
    note.supervisor = status;
    this.addNotification("Lesson note reviewed", `${note.student}'s ${note.subject} lesson note was marked ${status}.`, "lesson");
    persistDemoState();
    return note;
  }

  visits(user?: AuthenticatedUser) {
    return this.scopeWorkflow(user).visits;
  }

  createVisit(input: Partial<WorkflowData["visits"][number]>) {
    const visit = { ...input, id: input.id || `VS-${Date.now().toString().slice(-3)}`, status: "Scheduled" } as WorkflowData["visits"][number];
    workflow.visits.unshift(visit);
    this.addNotification("Visit scheduled", `${visit.student} has a supervision window at ${visit.school}.`, "visit");
    persistDemoState();
    return visit;
  }

  rescheduleVisit(id: string, input: { rescheduledDate: string; time?: string; reason?: string }) {
    // Coordinators create a visit window; supervisors can select/reschedule the exact date.
    const visit = workflow.visits.find((item) => item.id === id);
    if (!visit) return null;
    visit.rescheduledDate = input.rescheduledDate;
    visit.time = input.time || visit.time;
    visit.rescheduleReason = input.reason;
    visit.status = "Rescheduled";
    this.addNotification("Visit rescheduled", `${visit.student}'s supervision visit was rescheduled.`, "visit");
    persistDemoState();
    return visit;
  }

  completeVisit(id: string) {
    const visit = workflow.visits.find((item) => item.id === id);
    if (!visit) return null;
    visit.status = "Completed";
    this.addNotification("Visit completed", `${visit.supervisor} completed a visit for ${visit.student}.`, "visit");
    persistDemoState();
    return visit;
  }

  private currentStudent(user?: AuthenticatedUser) {
    if (!user) return undefined;
    const identifier = this.normalizeIdentifier(user.identifier);
    return workflow.students.find((item) => item.id.toLowerCase() === identifier || this.normalizeIdentifier(item.email) === identifier || item.name === user.name);
  }

  private normalizeIdentifier(identifier: string) {
    return identifier.trim().toLowerCase().replace("@st.ammusted.edu.gh", "@st.aamusted.edu.gh");
  }

  private supervisorStudentNames(user: AuthenticatedUser) {
    const assignedPlacements = workflow.placements.filter((item) => item.supervisor.includes(user.name) || item.supervisor.includes("Ofori") || item.supervisor === "Dr. S. Ofori");
    return new Set(assignedPlacements.map((item) => item.student));
  }

  private studentNameFromMessage(message: string) {
    return workflow.students.find((student) => message.includes(student.name))?.name || "";
  }

  private mergeOwned<K extends "placements" | "notes" | "visits" | "notifications">(key: K, incoming: WorkflowData[K], owns: (item: WorkflowData[K][number]) => boolean) {
    const ownedIncoming = incoming.filter(owns) as WorkflowData[K];
    const retained = workflow[key].filter((item) => !owns(item as WorkflowData[K][number])) as WorkflowData[K];
    workflow[key] = [...ownedIncoming, ...retained] as WorkflowData[K];
  }

  private scopeWorkflow(user?: AuthenticatedUser): WorkflowData {
    if (user?.role === "student") {
      const student = this.currentStudent(user);
      if (!student) return { ...workflow, students: [], placements: [], notes: [], visits: [], notifications: [] };
      return {
        ...workflow,
        students: [student],
        placements: workflow.placements.filter((item) => item.student === student.name),
        notes: workflow.notes.filter((item) => item.student === student.name),
        visits: workflow.visits.filter((item) => item.student === student.name),
        notifications: workflow.notifications.filter((item) => item.message.includes(student.name)),
      };
    }
    if (user?.role === "supervisor") {
      const names = this.supervisorStudentNames(user);
      return {
        ...workflow,
        students: workflow.students.filter((item) => names.has(item.name)),
        placements: workflow.placements.filter((item) => names.has(item.student)),
        notes: workflow.notes.filter((item) => names.has(item.student)),
        visits: workflow.visits.filter((item) => names.has(item.student) || item.supervisor.includes(user.name)),
        notifications: workflow.notifications.filter((item) => names.has(this.studentNameFromMessage(item.message)) || item.message.includes(user.name)),
      };
    }
    return workflow;
  }
}
