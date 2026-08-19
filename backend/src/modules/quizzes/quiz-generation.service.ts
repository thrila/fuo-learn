import { GeminiClient } from "../../infrastructure/gemini/index.js";
import { Logger } from "../../shared/utils/logger.js";
import type { GenerateQuizFromMaterialInput, GeneratedQuiz } from "./quiz-generation.types.js";
import { generatedQuizSchema } from "./quiz-generation.types.js";
import { BadRequestError } from "../../shared/errors/index.js";

const DEFAULT_QUESTIONS = 10;

export class QuizGenerationService {
  private logger: Logger;

  constructor(
    private geminiClient: GeminiClient
  ) {
    this.logger = new Logger("QuizGenerationService");
  }

  async generateQuiz(input: GenerateQuizFromMaterialInput): Promise<GeneratedQuiz> {
    const questionCount = input.numberOfQuestions ?? DEFAULT_QUESTIONS;

    const prompt = this.buildPrompt(input, questionCount);

    this.logger.info("Sending quiz generation request to Gemini", {
      materialTitle: input.materialTitle,
      contentLength: input.content.length,
      questionCount,
    });

    let rawResult: unknown;
    try {
      rawResult = await this.geminiClient.generateJson(prompt, {
        maxTokens: 4096,
        temperature: 0.3,
      });
    } catch (err) {
      this.logger.error("Gemini API call failed", {
        error: err instanceof Error ? err.message : String(err),
      });
      throw new BadRequestError("Quiz generation failed — AI service error");
    }

    this.logger.info("Received Gemini response, validating...");

    const parsed = this.parseAndValidate(rawResult, questionCount);

    this.logger.info("Quiz generation validated successfully", {
      title: parsed.title,
      questionCount: parsed.questions.length,
    });

    return parsed;
  }

  private buildPrompt(input: GenerateQuizFromMaterialInput, questionCount: number): string {
    let context = `Course: ${input.courseTitle ?? "General"}\n`;
    context += `Material: ${input.materialTitle}\n\n`;
    context += `--- Material Content ---\n${input.content}\n--- End Content ---\n\n`;

    return `${context}Generate a quiz based on the above material.

Requirements:
- Generate exactly ${questionCount} multiple-choice questions
- Each question must have exactly 4 options
- One option must be the correct answer
- Include a brief explanation for each correct answer
- Questions should test understanding, not just recall
- Vary difficulty: some easy, some medium, some hard

Respond with ONLY valid JSON in this exact format (no markdown, no code fences):
{
  "title": "Quiz: [topic from material]",
  "description": "Brief description of the quiz",
  "questions": [
    {
      "question": "The question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Why this is correct"
    }
  ]
}`;
  }

  private parseAndValidate(raw: unknown, expectedQuestionCount: number): GeneratedQuiz {
    if (raw === null || typeof raw !== "object") {
      throw new BadRequestError("Invalid response format from AI");
    }

    const result = generatedQuizSchema.safeParse(raw);

    if (!result.success) {
      this.logger.warn("Gemini response failed validation", {
        errors: result.error.issues,
      });
      throw new BadRequestError("AI-generated quiz did not meet validation requirements");
    }

    for (const q of result.data.questions) {
      if (!q.options.includes(q.correctAnswer)) {
        throw new BadRequestError(
          `AI-generated correct answer "${q.correctAnswer}" not found in options for: "${q.question.slice(0, 50)}..."`
        );
      }
    }

    if (result.data.questions.length !== expectedQuestionCount) {
      throw new BadRequestError(
        `AI-generated quiz contained ${result.data.questions.length} questions; ${expectedQuestionCount} were requested`
      );
    }

    return result.data;
  }
}
