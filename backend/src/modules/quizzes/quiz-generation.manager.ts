import type { UserRole } from "../../shared/types/index.js";
import { ContentExtractionService } from "../materials/material-extraction.service.js";
import { MaterialRepository } from "../materials/material.repository.js";
import { QuizGenerationService } from "./quiz-generation.service.js";
import { QuizRepository } from "./quiz.repository.js";
import { NotFoundError, ForbiddenError, BadRequestError } from "../../shared/errors/index.js";
import { Logger } from "../../shared/utils/logger.js";
import type { GeneratedQuiz } from "./quiz-generation.types.js";
import type { LocalStorage } from "../../infrastructure/storage/index.js";

export interface GenerateQuizResult {
  generatedQuiz: GeneratedQuiz;
  savedQuiz: {
    id: string;
    title: string;
    courseId: string;
    questionCount: number;
  };
}

export class QuizGenerationManager {
  private logger: Logger;

  constructor(
    private generationService: QuizGenerationService,
    private extractionService: ContentExtractionService,
    private materialRepo: MaterialRepository,
    private quizRepo: QuizRepository,
    private storage: LocalStorage
  ) {
    this.logger = new Logger("QuizGenerationManager");
  }

  async generateFromMaterial(
    materialId: string,
    requestorId: string,
    requestorRole: UserRole,
    options?: { numberOfQuestions?: number }
  ): Promise<GenerateQuizResult> {
    const material = await this.materialRepo.findById(materialId);
    if (!material) throw new NotFoundError("Material not found");

    if (requestorRole === "professor" && material.uploaded_by !== requestorId) {
      throw new ForbiddenError("You can only generate quizzes from your own materials");
    }

    this.logger.info("Starting quiz generation from material", {
      materialId,
      materialTitle: material.title,
      fileType: material.file_type,
    });

    if (material.file_type !== "application/pdf") {
      throw new BadRequestError("Quiz generation currently supports PDF files only");
    }

    if (!material.file_key) {
      throw new BadRequestError("Material file not found in storage");
    }

    const buffer = await this.storage.read(material.file_key);

    const extracted = await this.extractionService.extractFromBuffer(buffer, material.file_type);

    this.logger.info("Content extracted, generating quiz...", {
      textLength: extracted.text.length,
      pageCount: extracted.pageCount,
    });

    const generatedQuiz = await this.generationService.generateQuiz({
      content: extracted.text,
      materialTitle: material.title,
      numberOfQuestions: options?.numberOfQuestions,
    });

    const quiz = await this.quizRepo.create({
      course_id: material.course_id,
      title: generatedQuiz.title,
      description: generatedQuiz.description,
      created_by: requestorId,
    });

    try {
      for (let i = 0; i < generatedQuiz.questions.length; i++) {
        const q = generatedQuiz.questions[i];
        await this.quizRepo.addQuestion({
          quiz_id: quiz.id,
          question: q.question,
          options: q.options,
          correct_answer: q.correctAnswer,
          explanation: q.explanation,
          sort_order: i,
        });
      }
    } catch (err) {
      await this.quizRepo.deleteQuestionsByQuiz(quiz.id);
      await this.quizRepo.delete(quiz.id);
      this.logger.error("Could not save generated quiz", {
        quizId: quiz.id,
        error: err instanceof Error ? err.message : String(err),
      });
      throw new BadRequestError("Could not save the generated quiz");
    }

    this.logger.info("Quiz saved from AI generation", {
      quizId: quiz.id,
      questionCount: generatedQuiz.questions.length,
    });

    return {
      generatedQuiz,
      savedQuiz: {
        id: quiz.id,
        title: quiz.title,
        courseId: quiz.course_id,
        questionCount: generatedQuiz.questions.length,
      },
    };
  }
}
