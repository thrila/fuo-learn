import { NotFoundError, BadRequestError, ForbiddenError } from "../../shared/errors/index.js";
import type { UserRole } from "../../shared/types/index.js";
import { QuizAttemptRepository, type QuizAttemptWithDetails } from "./quiz-attempt.repository.js";
import { QuizRepository } from "../quizzes/quiz.repository.js";
import type { CourseRepository } from "../courses/course.repository.js";
import type { EnrollmentRepository } from "../enrollments/enrollment.repository.js";

export class QuizAttemptService {
  constructor(
    private attemptRepo: QuizAttemptRepository,
    private quizRepo: QuizRepository,
    private courseRepo: CourseRepository,
    private enrollmentRepo: EnrollmentRepository
  ) {}

  async startAttempt(quizId: string, studentId: string): Promise<{ attemptId: string }> {
    const quiz = await this.quizRepo.findById(quizId);
    if (!quiz) throw new NotFoundError("Quiz not found");

    if (!quiz.is_published) {
      throw new BadRequestError("Quiz is not published");
    }

    const enrollment = await this.enrollmentRepo.findExisting(quiz.course_id, studentId);
    if (!enrollment || enrollment.status !== "approved") {
      throw new ForbiddenError("You must be enrolled in this course to take this quiz");
    }

    const existing = await this.attemptRepo.findExisting(quizId, studentId);
    if (existing) {
      return { attemptId: existing.id };
    }

    const attempt = await this.attemptRepo.create(quizId, studentId);
    return { attemptId: attempt.id };
  }

  async submitAttempt(
    attemptId: string,
    answers: { questionId: string; selectedAnswer: string }[],
    studentId: string,
    requestorRole: UserRole
  ): Promise<{ score: number; total: number; correct: number }> {
    const attempt = await this.attemptRepo.findById(attemptId);
    if (!attempt) throw new NotFoundError("Attempt not found");

    if (attempt.completed_at) {
      throw new BadRequestError("This attempt has already been completed");
    }

    if (requestorRole === "student" && attempt.student_id !== studentId) {
      throw new ForbiddenError("You can only submit your own attempts");
    }

    const questions = await this.quizRepo.findQuestionsByQuiz(attempt.quiz_id);
    const questionMap = new Map(questions.map(q => [q.id, q]));

    let correct = 0;
    for (const answer of answers) {
      const question = questionMap.get(answer.questionId);
      if (!question) continue;

      const isCorrect = question.correct_answer === answer.selectedAnswer;
      if (isCorrect) correct++;

      await this.attemptRepo.saveAnswer({
        attempt_id: attemptId,
        question_id: answer.questionId,
        selected_answer: answer.selectedAnswer,
        is_correct: isCorrect,
      });
    }

    const total = questions.length;
    const score = total > 0 ? Math.round((correct / total) * 100 * 100) / 100 : 0;

    await this.attemptRepo.complete(attemptId, score);

    return { score, total, correct };
  }

  async getAttempt(attemptId: string, studentId: string, requestorRole: UserRole) {
    const attempt = await this.attemptRepo.findByIdWithDetails(attemptId);
    if (!attempt) throw new NotFoundError("Attempt not found");

    if (requestorRole === "student" && attempt.student_id !== studentId) {
      throw new ForbiddenError("You can only view your own attempts");
    }

    const answers = await this.attemptRepo.findAnswers(attemptId);
    return { attempt, answers };
  }

  async getMyAttempts(studentId: string): Promise<QuizAttemptWithDetails[]> {
    return this.attemptRepo.findByStudent(studentId);
  }
}
