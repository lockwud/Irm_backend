import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export type AuthenticatedUser = {
  role: "student" | "supervisor" | "coordinator";
  identifier: string;
  name: string;
};

const supportedRoles: AuthenticatedUser["role"][] = ["student", "supervisor", "coordinator"];

function normalizeAuthenticatedUser(payload: unknown): AuthenticatedUser | null {
  if (!payload || typeof payload !== "object") return null;
  const decoded = payload as Partial<AuthenticatedUser>;
  const role = String(decoded.role || "").trim().toLowerCase() as AuthenticatedUser["role"];
  const identifier = String(decoded.identifier || "").trim();
  const name = String(decoded.name || "").trim();
  if (!supportedRoles.includes(role) || !identifier || !name) return null;
  return { role, identifier, name };
}

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthenticatedUser;
  }
}

export function requireAuth(request: Request, response: Response, next: NextFunction) {
  const header = request.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (!token) {
    return response.status(401).json({ error: "Missing bearer token. Login first and send Authorization: Bearer <token>." });
  }

  try {
    const user = normalizeAuthenticatedUser(jwt.verify(token, env.jwtSecret));
    if (!user) return response.status(401).json({ error: "Invalid token payload. Login again." });
    request.user = user;
    return next();
  } catch {
    return response.status(401).json({ error: "Invalid or expired token." });
  }
}

export function requireRoles(...roles: AuthenticatedUser["role"][]) {
  return (request: Request, response: Response, next: NextFunction) => {
    if (!request.user) return response.status(401).json({ error: "Authentication is required." });
    const role = String(request.user.role || "").trim().toLowerCase() as AuthenticatedUser["role"];
    if (!roles.includes(role)) return response.status(403).json({ error: "You do not have permission to access this resource." });
    request.user.role = role;
    return next();
  };
}
