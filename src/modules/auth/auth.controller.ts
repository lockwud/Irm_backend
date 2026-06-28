import type { Request, Response } from "express";
import { z } from "zod";
import { AuthService } from "./auth.service.js";

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  login = (request: Request, response: Response) => {
    const schema = z.object({ role: z.enum(["student", "supervisor", "coordinator"]), identifier: z.string().min(1), password: z.string().min(1) });
    const parsed = schema.safeParse(request.body);
    if (!parsed.success) return response.status(400).json({ error: "Complete all login fields." });
    const result = this.authService.login(parsed.data.role, parsed.data.identifier, parsed.data.password);
    if (!result) return response.status(401).json({ error: "The login details are incorrect for the selected portal." });
    return response.json(result);
  };

  changePassword = (request: Request, response: Response) => {
    const schema = z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(8) });
    const parsed = schema.safeParse(request.body);
    if (!parsed.success) return response.status(400).json({ error: "Enter your current password and a new password of at least 8 characters." });
    if (!request.user) return response.status(401).json({ error: "Login before changing your password." });
    const result = this.authService.changePassword(request.user.role, request.user.identifier, parsed.data.currentPassword, parsed.data.newPassword);
    if (!result) return response.status(400).json({ error: "Your current password is incorrect." });
    return response.json(result);
  };
}
