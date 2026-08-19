import type { UserRole } from "../../shared/types/index.js";
import { QuizService } from "./quiz.service.js";

export class QuizManager {
  constructor(private quizService: QuizService) {}

  async getQuiz(id: string) {
    return this.quizService.getQuiz(id);
  }

  async listByCourse(courseId: string) {
    return this.quizService.listByCourse(courseId);
  }

  async getQuestions(quizId: string) {
    return this.quizService.getQuestions(quizId);
  }

  async createQuiz(input: { courseId: string; title: string; description?: string; createdBy: string }, requestorRole: UserRole) {
    return this.quizService.createQuiz(input, requestorRole);
  }

  async updateQuiz(id: string, input: { title?: string; description?: string }, requestorId: string, requestorRole: UserRole) {
    return this.quizService.updateQuiz(id, input, requestorId, requestorRole);
  }

  async publishQuiz(id: string, requestorId: string, requestorRole: UserRole) {
    return this.quizService.publishQuiz(id, requestorId, requestorRole);
  }

  async unpublishQuiz(id: string, requestorId: string, requestorRole: UserRole) {
    return this.quizService.unpublishQuiz(id, requestorId, requestorRole);
  }

  async addQuestion(quizId: string, input: { question: string; options: string[]; correctAnswer: string; explanation?: string; sortOrder?: number }, requestorId: string, requestorRole: UserRole) {
    return this.quizService.addQuestion(quizId, input, requestorId, requestorRole);
  }

  async deleteQuiz(id: string, requestorId: string, requestorRole: UserRole) {
    return this.quizService.deleteQuiz(id, requestorId, requestorRole);
  }

  async deleteQuestion(questionId: string, requestorId: string, requestorRole: UserRole) {
    return this.quizService.deleteQuestion(questionId, requestorId, requestorRole);
  }
}
