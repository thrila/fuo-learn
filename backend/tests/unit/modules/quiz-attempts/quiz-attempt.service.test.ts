import { describe, it, expect, vi, beforeEach } from "vitest";
import { QuizAttemptService } from "../../../../src/modules/quiz-attempts/quiz-attempt.service.js";
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
} from "../../../../src/shared/errors/index.js";

function makeQuiz(overrides: Record<string, unknown> = {}) {
  return {
    id: "quiz-1",
    course_id: "course-1",
    title: "Test Quiz",
    description: null,
    is_published: true,
    generation_status: null,
    created_by: "prof-1",
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

function makeAttempt(overrides: Record<string, unknown> = {}) {
  return {
    id: "attempt-1",
    quiz_id: "quiz-1",
    student_id: "student-1",
    score: null,
    started_at: new Date(),
    completed_at: null,
    ...overrides,
  };
}

function makeQuestion(overrides: Record<string, unknown> = {}) {
  return {
    id: "q-1",
    quiz_id: "quiz-1",
    question: "What is 2+2?",
    options: ["1", "2", "3", "4"],
    correct_answer: "4",
    explanation: null,
    sort_order: 0,
    created_at: new Date(),
    ...overrides,
  };
}

function mockAttemptRepo() {
  return {
    findById: vi.fn(),
    findByIdWithDetails: vi.fn(),
    findExisting: vi.fn(),
    findByStudent: vi.fn(),
    findAnswers: vi.fn(),
    create: vi.fn(),
    complete: vi.fn(),
    saveAnswer: vi.fn(),
  } as any;
}

function mockQuizRepo() {
  return {
    findById: vi.fn(),
    findQuestionsByQuiz: vi.fn(),
  } as any;
}

function mockCourseRepo() {
  return {
    findById: vi.fn(),
  } as any;
}

function mockEnrollmentRepo() {
  return {
    findExisting: vi.fn(),
  } as any;
}

describe("QuizAttemptService", () => {
  let service: QuizAttemptService;
  let attemptRepo: ReturnType<typeof mockAttemptRepo>;
  let quizRepo: ReturnType<typeof mockQuizRepo>;
  let courseRepo: ReturnType<typeof mockCourseRepo>;
  let enrollmentRepo: ReturnType<typeof mockEnrollmentRepo>;

  beforeEach(() => {
    attemptRepo = mockAttemptRepo();
    quizRepo = mockQuizRepo();
    courseRepo = mockCourseRepo();
    enrollmentRepo = mockEnrollmentRepo();
    enrollmentRepo.findExisting.mockResolvedValue({ status: "approved" });
    service = new QuizAttemptService(attemptRepo, quizRepo, courseRepo, enrollmentRepo);
    vi.clearAllMocks();
  });

  describe("startAttempt", () => {
    it("creates a new attempt for a published quiz", async () => {
      quizRepo.findById.mockResolvedValue(makeQuiz());
      attemptRepo.findExisting.mockResolvedValue(null);
      attemptRepo.create.mockResolvedValue(makeAttempt());

      const result = await service.startAttempt("quiz-1", "student-1");
      expect(result.attemptId).toBe("attempt-1");
    });

    it("reuses an existing incomplete attempt", async () => {
      quizRepo.findById.mockResolvedValue(makeQuiz());
      attemptRepo.findExisting.mockResolvedValue(makeAttempt());

      const result = await service.startAttempt("quiz-1", "student-1");
      expect(result.attemptId).toBe("attempt-1");
      expect(attemptRepo.create).not.toHaveBeenCalled();
    });

    it("throws NotFoundError if quiz does not exist", async () => {
      quizRepo.findById.mockResolvedValue(null);

      await expect(
        service.startAttempt("nonexistent", "student-1")
      ).rejects.toThrow(NotFoundError);
    });

    it("throws BadRequestError if quiz is not published", async () => {
      quizRepo.findById.mockResolvedValue(
        makeQuiz({ is_published: false })
      );

      await expect(
        service.startAttempt("quiz-1", "student-1")
      ).rejects.toThrow(BadRequestError);
    });

    it("forbids students who are not approved for the course", async () => {
      quizRepo.findById.mockResolvedValue(makeQuiz());
      enrollmentRepo.findExisting.mockResolvedValue({ status: "pending" });

      await expect(
        service.startAttempt("quiz-1", "student-1")
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe("submitAttempt", () => {
    it("scores answers correctly", async () => {
      attemptRepo.findById.mockResolvedValue(makeAttempt());
      quizRepo.findQuestionsByQuiz.mockResolvedValue([
        makeQuestion({ id: "q-1", correct_answer: "4" }),
        makeQuestion({ id: "q-2", correct_answer: "A" }),
      ]);
      attemptRepo.saveAnswer.mockResolvedValue({});
      attemptRepo.complete.mockResolvedValue(makeAttempt());

      const result = await service.submitAttempt(
        "attempt-1",
        [
          { questionId: "q-1", selectedAnswer: "4" },
          { questionId: "q-2", selectedAnswer: "A" },
        ],
        "student-1",
        "student"
      );

      expect(result.correct).toBe(2);
      expect(result.total).toBe(2);
      expect(result.score).toBe(100);
    });

    it("calculates partial score", async () => {
      attemptRepo.findById.mockResolvedValue(makeAttempt());
      quizRepo.findQuestionsByQuiz.mockResolvedValue([
        makeQuestion({ id: "q-1", correct_answer: "4" }),
        makeQuestion({ id: "q-2", correct_answer: "A" }),
      ]);
      attemptRepo.saveAnswer.mockResolvedValue({});
      attemptRepo.complete.mockResolvedValue(makeAttempt());

      const result = await service.submitAttempt(
        "attempt-1",
        [
          { questionId: "q-1", selectedAnswer: "4" },
          { questionId: "q-2", selectedAnswer: "WRONG" },
        ],
        "student-1",
        "student"
      );

      expect(result.correct).toBe(1);
      expect(result.total).toBe(2);
      expect(result.score).toBe(50);
    });

    it("throws BadRequestError if attempt already completed", async () => {
      attemptRepo.findById.mockResolvedValue(
        makeAttempt({ completed_at: new Date() })
      );

      await expect(
        service.submitAttempt(
          "attempt-1",
          [{ questionId: "q-1", selectedAnswer: "4" }],
          "student-1",
          "student"
        )
      ).rejects.toThrow(BadRequestError);
    });

    it("throws ForbiddenError if student tries to submit another student's attempt", async () => {
      attemptRepo.findById.mockResolvedValue(makeAttempt());

      await expect(
        service.submitAttempt(
          "attempt-1",
          [{ questionId: "q-1", selectedAnswer: "4" }],
          "other-student",
          "student"
        )
      ).rejects.toThrow(ForbiddenError);
    });

    it("allows professor to submit any attempt", async () => {
      attemptRepo.findById.mockResolvedValue(makeAttempt());
      quizRepo.findQuestionsByQuiz.mockResolvedValue([]);
      attemptRepo.saveAnswer.mockResolvedValue({});
      attemptRepo.complete.mockResolvedValue(makeAttempt());

      await expect(
        service.submitAttempt("attempt-1", [], "prof-1", "professor")
      ).resolves.toBeDefined();
    });

    it("throws NotFoundError if attempt does not exist", async () => {
      attemptRepo.findById.mockResolvedValue(null);

      await expect(
        service.submitAttempt("nonexistent", [], "student-1", "student")
      ).rejects.toThrow(NotFoundError);
    });

    it("silently skips answers for non-existent questions", async () => {
      attemptRepo.findById.mockResolvedValue(makeAttempt());
      quizRepo.findQuestionsByQuiz.mockResolvedValue([
        makeQuestion({ id: "q-1", correct_answer: "4" }),
      ]);
      attemptRepo.saveAnswer.mockResolvedValue({});
      attemptRepo.complete.mockResolvedValue(makeAttempt());

      const result = await service.submitAttempt(
        "attempt-1",
        [
          { questionId: "q-1", selectedAnswer: "4" },
          { questionId: "q-nonexistent", selectedAnswer: "X" },
        ],
        "student-1",
        "student"
      );

      expect(result.correct).toBe(1);
      expect(result.total).toBe(1);
      expect(attemptRepo.saveAnswer).toHaveBeenCalledTimes(1);
    });
  });

  describe("getAttempt", () => {
    it("returns attempt with answers", async () => {
      attemptRepo.findByIdWithDetails.mockResolvedValue(makeAttempt());
      attemptRepo.findAnswers.mockResolvedValue([]);

      const result = await service.getAttempt("attempt-1", "student-1", "student");
      expect(result.attempt.id).toBe("attempt-1");
      expect(result.answers).toEqual([]);
    });

    it("throws ForbiddenError if student tries to view another student's attempt", async () => {
      attemptRepo.findByIdWithDetails.mockResolvedValue(makeAttempt());

      await expect(
        service.getAttempt("attempt-1", "other-student", "student")
      ).rejects.toThrow(ForbiddenError);
    });

    it("allows professor to view any attempt", async () => {
      attemptRepo.findByIdWithDetails.mockResolvedValue(makeAttempt());
      attemptRepo.findAnswers.mockResolvedValue([]);

      await expect(
        service.getAttempt("attempt-1", "prof-1", "professor")
      ).resolves.toBeDefined();
    });
  });

  describe("getMyAttempts", () => {
    it("returns student's attempts", async () => {
      attemptRepo.findByStudent.mockResolvedValue([]);

      const result = await service.getMyAttempts("student-1");
      expect(result).toEqual([]);
    });
  });
});
