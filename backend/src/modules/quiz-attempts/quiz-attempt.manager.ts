import type { UserRole } from "../../shared/types/index.js";
import { QuizAttemptService } from "./quiz-attempt.service.js";

export class QuizAttemptManager {
  constructor(private attemptService: QuizAttemptService) {}

  async startAttempt(quizId: string, studentId: string) {
    return this.attemptService.startAttempt(quizId, studentId);
  }

  async submitAttempt(attemptId: string, answers: { questionId: string; selectedAnswer: string }[], studentId: string, requestorRole: UserRole) {
    return this.attemptService.submitAttempt(attemptId, answers, studentId, requestorRole);
  }

  async getAttempt(attemptId: string, studentId: string, requestorRole: UserRole) {
    return this.attemptService.getAttempt(attemptId, studentId, requestorRole);
  }

  async getMyAttempts(studentId: string) {
    return this.attemptService.getMyAttempts(studentId);
  }
}
