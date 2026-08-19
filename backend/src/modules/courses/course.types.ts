import { z } from "zod";

export const createCourseSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  code: z.string().min(1).max(50),
  professorId: z.uuid(),
});

export const updateCourseSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional(),
  code: z.string().min(1).max(50).optional(),
  professorId: z.uuid().optional(),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
