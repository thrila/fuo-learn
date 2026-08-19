import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../../shared/types/index.js";
import type { QuizGenerationManager } from "./quiz-generation.manager.js";

export class QuizGenerationController {
  constructor(private generationManager: QuizGenerationManager) {}

  generateFromMaterial = async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const materialId = String(req.params.materialId);

    const result = await this.generationManager.generateFromMaterial(
      materialId,
      authReq.user.id,
      authReq.user.role,
      { numberOfQuestions: req.body.numberOfQuestions }
    );

    res.status(201).json({
      quiz: result.savedQuiz,
      generated: result.generatedQuiz,
    });
  };
}
