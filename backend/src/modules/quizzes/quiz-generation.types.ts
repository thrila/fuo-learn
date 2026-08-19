import { z } from "zod";

export const generatedQuestionSchema = z.object({
  question: z.string().trim().min(1).max(2_000),
  options: z.array(z.string().trim().min(1).max(500)).length(4)
    .refine((options) => new Set(options).size === options.length, "Options must be unique"),
  correctAnswer: z.string().trim().min(1).max(500),
  explanation: z.string().trim().min(1).max(2_000).optional(),
});

export const generatedQuizSchema = z.object({
  title: z.string().trim().min(1).max(255),
  description: z.string().trim().min(1).max(2_000).optional(),
  questions: z.array(generatedQuestionSchema).min(1).max(20),
});

export const generateQuizRequestSchema = z.object({
  numberOfQuestions: z.number().int().min(1).max(20).optional(),
});

export type GeneratedQuiz = z.infer<typeof generatedQuizSchema>;
export type GeneratedQuestion = z.infer<typeof generatedQuestionSchema>;

export interface GenerateQuizFromMaterialInput {
  content: string;
  materialTitle: string;
  courseTitle?: string;
  numberOfQuestions?: number;
}
