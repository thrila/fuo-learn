import { type Request } from "express";

export type UserRole = "admin" | "professor" | "student";

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}
