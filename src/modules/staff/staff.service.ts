import { z } from "zod";
import { persistDemoState, staffInvites, staffMembers } from "../../seed.js";
import type { StaffInvite } from "../../types.js";
import { WorkflowService } from "../workflow/workflow.service.js";
import { provisionStaffAccount } from "../auth/auth.service.js";

export const staffInviteSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  staffId: z.string().min(2),
  role: z.enum(["coordinator", "supervisor"]),
  regions: z.array(z.string()).default([]),
});

export class StaffService {
  constructor(private readonly workflowService: WorkflowService) {}

  invitations() {
    return staffInvites;
  }

  createInvitation(input: z.infer<typeof staffInviteSchema>) {
    const invite: StaffInvite = {
      id: `INV-${Date.now().toString().slice(-5)}`,
      ...input,
      status: "Pending",
      invitedAt: new Date().toISOString(),
    };
    staffInvites.unshift(invite);
    const member = {
      id: `STF-${Date.now().toString().slice(-5)}`,
      name: invite.name,
      email: invite.email,
      staffId: invite.staffId,
      role: invite.role,
      regions: invite.regions,
      status: "Pending" as const,
    };
    staffMembers.unshift(member);
    const account = provisionStaffAccount(member);
    this.workflowService.addNotification("Staff invitation sent", `${invite.name} was invited as ${invite.role}.`, "staff");
    return { ...invite, account };
  }

  revokeInvitation(id: string) {
    const invite = staffInvites.find((item) => item.id === id);
    if (!invite) return null;
    invite.status = "Revoked";
    persistDemoState();
    return invite;
  }
}
