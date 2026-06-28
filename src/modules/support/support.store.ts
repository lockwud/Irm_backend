import fs from "node:fs";
import path from "node:path";

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

const supportDataDirectory = path.join(process.cwd(), "data");
const supportDataFile = path.join(supportDataDirectory, "support-tickets.json");

export function persistSupportTickets() {
  fs.mkdirSync(supportDataDirectory, { recursive: true });
  fs.writeFileSync(supportDataFile, JSON.stringify(supportTickets, null, 2));
}

function hydrateSupportTickets() {
  if (!fs.existsSync(supportDataFile)) return;
  try {
    const saved = JSON.parse(fs.readFileSync(supportDataFile, "utf8")) as SupportTicket[];
    if (Array.isArray(saved)) supportTickets.splice(0, supportTickets.length, ...saved);
  } catch (error) {
    console.warn("Could not load persisted support tickets; using seeded support queue.", error);
  }
}

hydrateSupportTickets();
