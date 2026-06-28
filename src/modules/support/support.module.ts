import { Router } from "express";
import { requireAuth, requireRoles } from "../../common/auth.middleware.js";
import type { FeatureModule } from "../../common/router.js";
import { persistSupportTickets, supportTickets } from "./support.store.js";

const router = Router();
router.use(requireAuth);

router.get("/support/tickets", requireRoles("coordinator"), (_request, response) => response.json(supportTickets));

router.post("/support/tickets", (request, response) => {
  const ticket = {
    id: `TCK-${Date.now().toString().slice(-5)}`,
    subject: request.body.subject || "Support request",
    message: request.body.message || "",
    requesterName: request.user?.name || request.body.requesterName || "Portal user",
    requesterRole: request.user?.role || request.body.requesterRole || "student",
    status: "Open" as const,
    priority: request.body.priority || "Normal",
    createdAt: new Date().toISOString(),
    replies: [],
  };
  supportTickets.unshift(ticket);
  persistSupportTickets();
  response.status(201).json(ticket);
});

router.post("/support/tickets/:id/replies", requireRoles("coordinator"), (request, response) => {
  const ticket = supportTickets.find((item) => item.id === String(request.params.id));
  if (!ticket) return response.status(404).json({ error: "Support ticket not found" });
  const reply = { id: `RPL-${Date.now().toString().slice(-5)}`, author: request.user?.name || "Coordinator", role: request.user?.role || "coordinator", message: request.body.message || "", createdAt: new Date().toISOString() };
  ticket.replies.push(reply);
  ticket.status = request.body.status || "In Progress";
  persistSupportTickets();
  response.status(201).json(ticket);
});

router.patch("/support/tickets/:id", requireRoles("coordinator"), (request, response) => {
  const ticket = supportTickets.find((item) => item.id === String(request.params.id));
  if (!ticket) return response.status(404).json({ error: "Support ticket not found" });
  Object.assign(ticket, request.body);
  persistSupportTickets();
  response.json(ticket);
});

export const SupportModule: FeatureModule = {
  basePath: "/api/v1",
  router,
};
