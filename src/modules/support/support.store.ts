import { persistState, readState } from "../../database/state-store.js";

export type SupportTicket = {
  id: string;
  subject: string;
  message: string;
  requesterName: string;
  requesterRole: "student" | "supervisor" | "coordinator";
  status: "Open" | "In Progress" | "Resolved";
  priority: "Low" | "Normal" | "High";
  createdAt: string;
  replies: { id: string; author: string; role: string; message: string; createdAt: string }[];
};

export const supportTickets: SupportTicket[] = [
  {
    id: "TCK-1001",
    subject: "Unable to download internship letter",
    message: "The download opens but I need help saving it as PDF.",
    requesterName: "Kwame Mensah",
    requesterRole: "student",
    status: "Open",
    priority: "Normal",
    createdAt: new Date().toISOString(),
    replies: [],
  },
];

export function persistSupportTickets() {
  persistState("sip.support-tickets", supportTickets);
}

export async function persistSupportTicketsNow() {
  await persistState("sip.support-tickets", supportTickets);
}

export async function hydrateSupportTicketsFromPostgres() {
  const saved = await readState<SupportTicket[]>("sip.support-tickets");
  if (Array.isArray(saved)) supportTickets.splice(0, supportTickets.length, ...saved);
  else await persistSupportTicketsNow();
}
