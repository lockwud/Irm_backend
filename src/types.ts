export type Student = {
  id: string;
  name: string;
  email: string;
  programme: string;
  department: string;
  year: number;
  school: string;
  region: string;
  status: "Active" | "Pending" | "Completed";
};

export type Placement = {
  id: string;
  student: string;
  school: string;
  municipality: string;
  community: string;
  region: string;
  supervisor: string;
  requested: string;
  status: "Pending" | "Approved" | "Rejected";
};

export type LessonNote = {
  id: string;
  student: string;
  subject: string;
  topic: string;
  week: string;
  mentor: "Pending" | "Approved" | "Revision";
  supervisor: "Pending" | "Approved" | "Revision";
  planType?: "Weekly" | "Termly";
  className?: string;
  weekEnding?: string;
  learningIndicators?: string;
  performanceIndicators?: string;
  resources?: string;
  phaseStarter?: string;
  phaseMain?: string;
  phaseReflection?: string;
  days?: { day: string; starter: string; main: string; reflection: string }[];
  term?: string;
  termOverview?: string;
  assessmentPlan?: string;
};

export type Visit = {
  id: string;
  student: string;
  supervisor: string;
  school: string;
  startDate: string;
  endDate: string;
  rescheduledDate?: string;
  time: string;
  rescheduleReason?: string;
  status: "Scheduled" | "Rescheduled" | "Completed" | "Missed" | "Cancelled" | "Draft";
};

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: string;
};

export type WorkflowData = {
  students: Student[];
  placements: Placement[];
  notes: LessonNote[];
  visits: Visit[];
  notifications: NotificationItem[];
};

export type StaffInvite = {
  id: string;
  name: string;
  email: string;
  staffId: string;
  role: "coordinator" | "supervisor";
  regions: string[];
  status: "Pending" | "Accepted" | "Revoked";
  invitedAt: string;
};

export type StaffMember = {
  id: string;
  name: string;
  email: string;
  staffId: string;
  role: "coordinator" | "supervisor";
  regions: string[];
  status: "Active" | "Pending" | "Inactive";
};

export type School = {
  id: string;
  name: string;
  region: string;
  municipality: string;
  community: string;
  category: string;
  ownership?: "Government" | "Private" | "Mission";
  interns: number;
  capacity: number;
  status: "Active" | "Pending" | "Inactive";
};

export type SupervisorAssignment = {
  id: string;
  supervisorId: string;
  supervisorName: string;
  staffId: string;
  regions: string[];
  internIds: string[];
  capacity: number;
  completedVisits: number;
  status: "Active" | "Inactive";
};

export type IrbField = {
  id: string;
  label: string;
  type: "text" | "textarea" | "date" | "checkbox" | "table";
  required: boolean;
};

export type IrbSection = {
  id: string;
  title: string;
  subtitle: string;
  fixed: boolean;
  fields: IrbField[];
};

export type IrbSubmission = {
  id: string;
  studentId: string;
  studentName: string;
  sectionId: string;
  sectionTitle: string;
  status: "Draft" | "Submitted" | "Approved" | "Revision";
  values: Record<string, unknown>;
  submittedAt?: string;
};

export type LessonNoteFormat = {
  id: string;
  modeDefault: "Weekly" | "Termly";
  fontSize: string;
  headingSize: string;
  lineHeight: string;
  tableDensity: "Compact" | "Comfortable" | "Spacious";
  fields: IrbField[];
};

export type InternshipLetterTemplate = {
  id: string;
  letterheadName: string;
  letterheadSubheading: string;
  logoUrl?: string;
  footerContact: string;
  title: string;
  body: string;
  signatories: { id: string; name: string; title: string }[];
};

export type AuditLog = {
  id: string;
  actor: string;
  action: string;
  record: string;
  timestamp: string;
};
