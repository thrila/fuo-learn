import { NotFoundError, ForbiddenError, BadRequestError } from "../../shared/errors/index.js";
import type { UserRole } from "../../shared/types/index.js";
import { QuizRepository, type QuizRow, type QuizWithCourse, type QuestionRow } from "./quiz.repository.js";
import type { CourseRepository } from "../courses/course.repository.js";

export class QuizService {
  constructor(
    private quizRepo: QuizRepository,
    private courseRepo: CourseRepository
  ) {}

  async getQuiz(id: string): Promise<QuizWithCourse> {
    const quiz = await this.quizRepo.findWithCourse(id);
    if (!quiz) throw new NotFoundError("Quiz not found");
    return quiz;
  }

  async listByCourse(courseId: string): Promise<QuizWithCourse[]> {
    return this.quizRepo.findByCourse(courseId);
  }

  async getQuestions(quizId: string): Promise<QuestionRow[]> {
    const quiz = await this.quizRepo.findById(quizId);
    if (!quiz) throw new NotFoundError("Quiz not found");
    return this.quizRepo.findQuestionsByQuiz(quizId);
  }

  async createQuiz(input: {
    courseId: string;
    title: string;
    description?: string;
    createdBy: string;
  }, requestorRole: UserRole = "professor"): Promise<QuizRow> {
    const course = await this.courseRepo.findById(input.courseId);
    if (!course) throw new NotFoundError("Course not found");

    if (requestorRole === "professor" && course.professor_id !== input.createdBy) {
      throw new ForbiddenError("You can only create quizzes for your own courses");
    }

    return this.quizRepo.create({
      course_id: input.courseId,
      title: input.title,
      description: input.description,
      created_by: input.createdBy,
    });
  }

  async updateQuiz(
    id: string,
    input: { title?: string; description?: string },
    requestorId: string,
    requestorRole: UserRole
  ): Promise<QuizRow> {
    const quiz = await this.quizRepo.findById(id);
    if (!quiz) throw new NotFoundError("Quiz not found");

    if (requestorRole === "professor" && quiz.created_by !== requestorId) {
      throw new ForbiddenError("You can only modify your own quizzes");
    }

    const updated = await this.quizRepo.update(id, input);
    return updated!;
  }

  async publishQuiz(
    id: string,
    requestorId: string,
    requestorRole: UserRole
  ): Promise<QuizRow> {
    const quiz = await this.quizRepo.findById(id);
    if (!quiz) throw new NotFoundError("Quiz not found");

    if (requestorRole === "professor" && quiz.created_by !== requestorId) {
      throw new ForbiddenError("You can only publish your own quizzes");
    }

    const questions = await this.quizRepo.findQuestionsByQuiz(id);
    if (questions.length === 0) {
      throw new BadRequestError("Cannot publish a quiz with no questions");
    }

    const updated = await this.quizRepo.update(id, { is_published: true });
    return updated!;
  }

  async unpublishQuiz(
    id: string,
    requestorId: string,
    requestorRole: UserRole
  ): Promise<QuizRow> {
    const quiz = await this.quizRepo.findById(id);
    if (!quiz) throw new NotFoundError("Quiz not found");

    if (requestorRole === "professor" && quiz.created_by !== requestorId) {
      throw new ForbiddenError("You can only unpublish your own quizzes");
    }

    const updated = await this.quizRepo.update(id, { is_published: false });
    return updated!;
  }

  async addQuestion(
    quizId: string,
    input: {
      question: string;
      options: string[];
      correctAnswer: string;
      explanation?: string;
      sortOrder?: number;
    },
    requestorId: string,
    requestorRole: UserRole
  ): Promise<QuestionRow> {
    const quiz = await this.quizRepo.findById(quizId);
    if (!quiz) throw new NotFoundError("Quiz not found");

    if (requestorRole === "professor" && quiz.created_by !== requestorId) {
      throw new ForbiddenError("You can only add questions to your own quizzes");
    }

    if (!input.options.includes(input.correctAnswer)) {
      throw new BadRequestError("correctAnswer must be one of the provided options");
    }

    const existing = await this.quizRepo.findQuestionsByQuiz(quizId);
    const sortOrder = input.sortOrder ?? existing.length;

    return this.quizRepo.addQuestion({
      quiz_id: quizId,
      question: input.question,
      options: input.options,
      correct_answer: input.correctAnswer,
      explanation: input.explanation,
      sort_order: sortOrder,
    });
  }

  async deleteQuestion(
    questionId: string,
    requestorId: string,
    requestorRole: UserRole
  ): Promise<void> {
    const question = await this.quizRepo.findQuestion(questionId);
    if (!question) throw new NotFoundError("Question not found");

    const quiz = await this.quizRepo.findById(question.quiz_id);
    if (!quiz) throw new NotFoundError("Quiz not found");

    if (requestorRole === "professor" && quiz.created_by !== requestorId) {
      throw new ForbiddenError("You can only delete questions from your own quizzes");
    }

    await this.quizRepo.deleteQuestion(questionId);
  }

  async deleteQuiz(
    id: string,
    requestorId: string,
    requestorRole: UserRole
  ): Promise<void> {
    const quiz = await this.quizRepo.findById(id);
    if (!quiz) throw new NotFoundError("Quiz not found");

    if (requestorRole === "professor" && quiz.created_by !== requestorId) {
      throw new ForbiddenError("You can only delete your own quizzes");
    }

    await this.quizRepo.deleteQuestionsByQuiz(id);
    await this.quizRepo.delete(id);
  }
}
