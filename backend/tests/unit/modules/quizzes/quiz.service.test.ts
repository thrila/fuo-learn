import { describe, it, expect, vi, beforeEach } from "vitest";
import { QuizService } from "../../../../src/modules/quizzes/quiz.service.js";
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
} from "../../../../src/shared/errors/index.js";

function makeQuiz(overrides: Record<string, unknown> = {}) {
  return {
    id: "quiz-1",
    course_id: "course-1",
    title: "Test Quiz",
    description: null,
    is_published: false,
    generation_status: null,
    created_by: "prof-1",
    created_at: new Date(),
    updated_at: new Date(),
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

function makeCourse() {
  return {
    id: "course-1",
    title: "Course",
    description: null,
    code: "C101",
    professor_id: "prof-1",
    created_at: new Date(),
    updated_at: new Date(),
    professor_first_name: "P",
    professor_last_name: "1",
    professor_email: "p@u.edu",
  };
}

function mockQuizRepo() {
  return {
    findById: vi.fn(),
    findWithCourse: vi.fn(),
    findByCourse: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findQuestion: vi.fn(),
    findQuestionsByQuiz: vi.fn(),
    addQuestion: vi.fn(),
    deleteQuestionsByQuiz: vi.fn(),
  } as any;
}

function mockCourseRepo() {
  return {
    findById: vi.fn(),
  } as any;
}

describe("QuizService", () => {
  let service: QuizService;
  let quizRepo: ReturnType<typeof mockQuizRepo>;
  let courseRepo: ReturnType<typeof mockCourseRepo>;

  beforeEach(() => {
    quizRepo = mockQuizRepo();
    courseRepo = mockCourseRepo();
    service = new QuizService(quizRepo, courseRepo);
    vi.clearAllMocks();
  });

  describe("getQuiz", () => {
    it("returns quiz with course info", async () => {
      quizRepo.findWithCourse.mockResolvedValue({
        ...makeQuiz(),
        course_title: "Course",
        course_code: "C101",
      });

      const result = await service.getQuiz("quiz-1");
      expect(result.id).toBe("quiz-1");
    });

    it("throws NotFoundError if quiz does not exist", async () => {
      quizRepo.findWithCourse.mockResolvedValue(null);

      await expect(service.getQuiz("nonexistent")).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe("createQuiz", () => {
    it("creates a quiz for an existing course", async () => {
      courseRepo.findById.mockResolvedValue(makeCourse());
      quizRepo.create.mockResolvedValue(makeQuiz());

      const result = await service.createQuiz({
        courseId: "course-1",
        title: "Test Quiz",
        createdBy: "prof-1",
      });
      expect(result.title).toBe("Test Quiz");
    });

    it("throws NotFoundError if course does not exist", async () => {
      courseRepo.findById.mockResolvedValue(null);

      await expect(
        service.createQuiz({
          courseId: "nonexistent",
          title: "Quiz",
          createdBy: "prof-1",
        })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("updateQuiz", () => {
    it("allows admin to update any quiz", async () => {
      quizRepo.findById.mockResolvedValue(makeQuiz());
      quizRepo.update.mockResolvedValue(makeQuiz({ title: "Updated" }));

      const result = await service.updateQuiz(
        "quiz-1",
        { title: "Updated" },
        "admin-1",
        "admin"
      );
      expect(result.title).toBe("Updated");
    });

    it("allows professor to update their own quiz", async () => {
      quizRepo.findById.mockResolvedValue(makeQuiz());
      quizRepo.update.mockResolvedValue(makeQuiz({ title: "Updated" }));

      const result = await service.updateQuiz(
        "quiz-1",
        { title: "Updated" },
        "prof-1",
        "professor"
      );
      expect(result.title).toBe("Updated");
    });

    it("forbids professor from updating another professor's quiz", async () => {
      quizRepo.findById.mockResolvedValue(makeQuiz());

      await expect(
        service.updateQuiz(
          "quiz-1",
          { title: "Hacked" },
          "prof-2",
          "professor"
        )
      ).rejects.toThrow(ForbiddenError);
    });

    it("throws NotFoundError if quiz does not exist", async () => {
      quizRepo.findById.mockResolvedValue(null);

      await expect(
        service.updateQuiz("nonexistent", {}, "admin-1", "admin")
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("publishQuiz", () => {
    it("publishes a quiz with questions", async () => {
      quizRepo.findById.mockResolvedValue(makeQuiz());
      quizRepo.findQuestionsByQuiz.mockResolvedValue([makeQuestion()]);
      quizRepo.update.mockResolvedValue(makeQuiz({ is_published: true }));

      const result = await service.publishQuiz("quiz-1", "prof-1", "professor");
      expect(result.is_published).toBe(true);
    });

    it("throws BadRequestError if quiz has no questions", async () => {
      quizRepo.findById.mockResolvedValue(makeQuiz());
      quizRepo.findQuestionsByQuiz.mockResolvedValue([]);

      await expect(
        service.publishQuiz("quiz-1", "prof-1", "professor")
      ).rejects.toThrow(BadRequestError);
    });

    it("forbids professor from publishing another professor's quiz", async () => {
      quizRepo.findById.mockResolvedValue(makeQuiz());

      await expect(
        service.publishQuiz("quiz-1", "prof-2", "professor")
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe("unpublishQuiz", () => {
    it("unpublishes a quiz", async () => {
      quizRepo.findById.mockResolvedValue(makeQuiz({ is_published: true }));
      quizRepo.update.mockResolvedValue(makeQuiz());

      const result = await service.unpublishQuiz(
        "quiz-1",
        "prof-1",
        "professor"
      );
      expect(result.is_published).toBe(false);
    });
  });

  describe("addQuestion", () => {
    it("adds a question with valid options", async () => {
      quizRepo.findById.mockResolvedValue(makeQuiz());
      quizRepo.findQuestionsByQuiz.mockResolvedValue([]);
      quizRepo.addQuestion.mockResolvedValue(makeQuestion());

      const result = await service.addQuestion(
        "quiz-1",
        {
          question: "What is 2+2?",
          options: ["1", "2", "3", "4"],
          correctAnswer: "4",
        },
        "prof-1",
        "professor"
      );
      expect(result.correct_answer).toBe("4");
    });

    it("throws BadRequestError if correctAnswer is not in options", async () => {
      quizRepo.findById.mockResolvedValue(makeQuiz());

      await expect(
        service.addQuestion(
          "quiz-1",
          {
            question: "What is 2+2?",
            options: ["1", "2", "3", "4"],
            correctAnswer: "5",
          },
          "prof-1",
          "professor"
        )
      ).rejects.toThrow(BadRequestError);
    });

    it("forbids professor from adding to another professor's quiz", async () => {
      quizRepo.findById.mockResolvedValue(makeQuiz());

      await expect(
        service.addQuestion(
          "quiz-1",
          {
            question: "Q?",
            options: ["A", "B"],
            correctAnswer: "A",
          },
          "prof-2",
          "professor"
        )
      ).rejects.toThrow(ForbiddenError);
    });

    it("defaults sortOrder to current question count", async () => {
      quizRepo.findById.mockResolvedValue(makeQuiz());
      quizRepo.findQuestionsByQuiz.mockResolvedValue([
        makeQuestion(),
        makeQuestion({ id: "q-2" }),
      ]);
      quizRepo.addQuestion.mockResolvedValue(makeQuestion());

      await service.addQuestion(
        "quiz-1",
        {
          question: "New?",
          options: ["A", "B"],
          correctAnswer: "A",
        },
        "prof-1",
        "professor"
      );

      const addCall = quizRepo.addQuestion.mock.calls[0][0];
      expect(addCall.sort_order).toBe(2);
    });
  });

  describe("deleteQuiz", () => {
    it("deletes quiz and its questions", async () => {
      quizRepo.findById.mockResolvedValue(makeQuiz());
      quizRepo.deleteQuestionsByQuiz.mockResolvedValue(undefined);
      quizRepo.delete.mockResolvedValue(true);

      await expect(
        service.deleteQuiz("quiz-1", "prof-1", "professor")
      ).resolves.toBeUndefined();
      expect(quizRepo.deleteQuestionsByQuiz).toHaveBeenCalledWith("quiz-1");
      expect(quizRepo.delete).toHaveBeenCalledWith("quiz-1");
    });

    it("forbids professor from deleting another professor's quiz", async () => {
      quizRepo.findById.mockResolvedValue(makeQuiz());

      await expect(
        service.deleteQuiz("quiz-1", "prof-2", "professor")
      ).rejects.toThrow(ForbiddenError);
    });
  });
});
