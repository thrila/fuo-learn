import { z } from "zod";

export const enrollSchema = z.object({
  courseId: z.uuid(),
});

export const approveEnrollmentSchema = z.object({
  status: z.enum(["approved", "rejected"]),
});

export type EnrollInput = z.infer<typeof enrollSchema>;
export type ApproveEnrollmentInput = z.infer<typeof approveEnrollmentSchema>;
