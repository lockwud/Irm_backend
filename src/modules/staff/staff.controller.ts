import type { Request, Response } from "express";
import { StaffService, staffInviteSchema } from "./staff.service.js";

export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  invitations = (_request: Request, response: Response) => response.json(this.staffService.invitations());

  createInvitation = (request: Request, response: Response) => {
    const parsed = staffInviteSchema.safeParse(request.body);
    if (!parsed.success) return response.status(400).json({ error: "Complete the staff onboarding form correctly.", details: parsed.error.flatten() });
    return response.status(201).json(this.staffService.createInvitation(parsed.data));
  };

  revokeInvitation = (request: Request, response: Response) => {
    const invite = this.staffService.revokeInvitation(String(request.params.id));
    if (!invite) return response.status(404).json({ error: "Invitation not found" });
    return response.json(invite);
  };
}
