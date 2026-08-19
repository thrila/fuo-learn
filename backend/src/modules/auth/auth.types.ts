import { z } from "zod";

export const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(128),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  role: z.enum(["admin", "professor", "student"]),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const updateStudentProfileSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateStudentProfileInput = z.infer<typeof updateStudentProfileSchema>;
