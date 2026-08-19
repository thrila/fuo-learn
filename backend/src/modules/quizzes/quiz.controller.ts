import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../../shared/types/index.js";
import type { QuizManager } from "./quiz.manager.js";

export class QuizController {
  constructor(private quizManager: QuizManager) {}

  getById = async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);
    const quiz = await this.quizManager.getQuiz(id);
    res.json({ quiz });
  };

  listByCourse = async (req: Request, res: Response): Promise<void> => {
    const courseId = String(req.params.id);
    const quizzes = await this.quizManager.listByCourse(courseId);
    res.json({ quizzes });
  };

  getQuestions = async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const quizId = String(req.params.id);
    const questions = await this.quizManager.getQuestions(quizId);
    // Students need the questions and options, but never the answer key.
    const responseQuestions = authReq.user.role === "student"
      ? questions.map(({ correct_answer: _correctAnswer, ...question }) => question)
      : questions;
    res.json({ questions: responseQuestions });
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const quiz = await this.quizManager.createQuiz({
      courseId: req.body.courseId,
      title: req.body.title,
      description: req.body.description,
      createdBy: authReq.user.id,
    }, authReq.user.role);
    res.status(201).json({ quiz });
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const id = String(req.params.id);
    const quiz = await this.quizManager.updateQuiz(
      id,
      { title: req.body.title, description: req.body.description },
      authReq.user.id,
      authReq.user.role
    );
    res.json({ quiz });
  };

  publish = async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const id = String(req.params.id);
    const quiz = await this.quizManager.publishQuiz(id, authReq.user.id, authReq.user.role);
    res.json({ quiz });
  };

  unpublish = async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const id = String(req.params.id);
    const quiz = await this.quizManager.unpublishQuiz(id, authReq.user.id, authReq.user.role);
    res.json({ quiz });
  };

  addQuestion = async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const quizId = String(req.params.id);
    const question = await this.quizManager.addQuestion(
      quizId,
      {
        question: req.body.question,
        options: req.body.options,
        correctAnswer: req.body.correctAnswer,
        explanation: req.body.explanation,
        sortOrder: req.body.sortOrder,
      },
      authReq.user.id,
      authReq.user.role
    );
    res.status(201).json({ question });
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const id = String(req.params.id);
    await this.quizManager.deleteQuiz(id, authReq.user.id, authReq.user.role);
    res.status(204).send();
  };

  deleteQuestion = async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const questionId = String(req.params.questionId);
    await this.quizManager.deleteQuestion(questionId, authReq.user.id, authReq.user.role);
    res.status(204).send();
  };
}
