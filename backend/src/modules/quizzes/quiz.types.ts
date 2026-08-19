import { z } from "zod";

export const createQuizSchema = z.object({
  courseId: z.uuid(),
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
});

export const updateQuizSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional(),
});

export const addQuestionSchema = z.object({
  question: z.string().min(1),
  options: z.array(z.string().min(1)).min(2),
  correctAnswer: z.string().min(1),
  explanation: z.string().optional(),
  sortOrder: z.number().int().optional(),
});

export const submitAttemptSchema = z.object({
  answers: z.array(z.object({
    questionId: z.uuid(),
    selectedAnswer: z.string().min(1),
  })),
});

export type CreateQuizInput = z.infer<typeof createQuizSchema>;
export type UpdateQuizInput = z.infer<typeof updateQuizSchema>;
export type AddQuestionInput = z.infer<typeof addQuestionSchema>;
export type SubmitAttemptInput = z.infer<typeof submitAttemptSchema>;
