import { beforeEach, describe, expect, it, vi } from "vitest";
import { QuizGenerationService } from "../../../../src/modules/quizzes/quiz-generation.service.js";
import { BadRequestError } from "../../../../src/shared/errors/index.js";

function validQuiz(questionCount = 2) {
  return {
    title: "Quiz: Intro to Biology",
    description: "Check your understanding.",
    questions: Array.from({ length: questionCount }, (_, index) => ({
      question: `Question ${index + 1}?`,
      options: ["A", "B", "C", "D"],
      correctAnswer: "A",
      explanation: "A is correct.",
    })),
  };
}

describe("QuizGenerationService", () => {
  const generateJson = vi.fn();
  const service = new QuizGenerationService({ generateJson } as never);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns validated AI output when it matches the requested question count", async () => {
    generateJson.mockResolvedValue(validQuiz(2));

    const result = await service.generateQuiz({
      materialTitle: "Week one notes",
      content: "Biology is the study of living organisms.".repeat(10),
      numberOfQuestions: 2,
    });

    expect(result.questions).toHaveLength(2);
  });

  it("rejects AI output with a different number of questions", async () => {
    generateJson.mockResolvedValue(validQuiz(1));

    await expect(service.generateQuiz({
      materialTitle: "Week one notes",
      content: "Biology is the study of living organisms.".repeat(10),
      numberOfQuestions: 2,
    })).rejects.toThrow(BadRequestError);
  });

  it("rejects a question whose answer is not one of its options", async () => {
    const quiz = validQuiz(1);
    quiz.questions[0].correctAnswer = "Missing option";
    generateJson.mockResolvedValue(quiz);

    await expect(service.generateQuiz({
      materialTitle: "Week one notes",
      content: "Biology is the study of living organisms.".repeat(10),
      numberOfQuestions: 1,
    })).rejects.toThrow(BadRequestError);
  });
});
