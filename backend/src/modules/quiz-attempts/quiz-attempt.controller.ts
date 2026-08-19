import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../../shared/types/index.js";
import type { QuizAttemptManager } from "./quiz-attempt.manager.js";

export class QuizAttemptController {
  constructor(private attemptManager: QuizAttemptManager) {}

  start = async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const quizId = String(req.params.id);
    const result = await this.attemptManager.startAttempt(quizId, authReq.user.id);
    res.status(201).json(result);
  };

  submit = async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const attemptId = String(req.params.id);
    const result = await this.attemptManager.submitAttempt(
      attemptId,
      req.body.answers,
      authReq.user.id,
      authReq.user.role
    );
    res.json(result);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const attemptId = String(req.params.id);
    const result = await this.attemptManager.getAttempt(
      attemptId,
      authReq.user.id,
      authReq.user.role
    );
    res.json(result);
  };

  getMyAttempts = async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const attempts = await this.attemptManager.getMyAttempts(authReq.user.id);
    res.json({ attempts });
  };
}
