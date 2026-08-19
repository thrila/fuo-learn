import type { Database } from "../../infrastructure/database/index.js";

export interface QuizAttemptRow {
  id: string;
  quiz_id: string;
  student_id: string;
  score: number | null;
  started_at: Date;
  completed_at: Date | null;
}

export interface QuizAttemptAnswerRow {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_answer: string;
  is_correct: boolean;
  created_at: Date;
}

export interface QuizAttemptWithDetails extends QuizAttemptRow {
  quiz_title: string;
  course_title: string;
  course_code: string;
  total_questions: number;
  correct_answers: number;
}

export class QuizAttemptRepository {
  constructor(private db: Database) {}

  async findById(id: string): Promise<QuizAttemptRow | null> {
    const result = await this.db.query("SELECT * FROM quiz_attempts WHERE id = $1", [id]);
    return result.rows[0] ?? null;
  }

  async findByIdWithDetails(id: string): Promise<QuizAttemptWithDetails | null> {
    const result = await this.db.query(
      `SELECT qa.*,
              q.title AS quiz_title,
              c.title AS course_title,
              c.code AS course_code,
              (SELECT COUNT(*) FROM questions WHERE quiz_id = qa.quiz_id)::int AS total_questions,
              (SELECT COUNT(*) FROM quiz_attempt_answers WHERE attempt_id = qa.id AND is_correct = true)::int AS correct_answers
       FROM quiz_attempts qa
       JOIN quizzes q ON q.id = qa.quiz_id
       JOIN courses c ON c.id = q.course_id
       WHERE qa.id = $1`,
      [id]
    );
    return result.rows[0] ?? null;
  }

  async findExisting(quizId: string, studentId: string): Promise<QuizAttemptRow | null> {
    const result = await this.db.query(
      "SELECT * FROM quiz_attempts WHERE quiz_id = $1 AND student_id = $2 AND completed_at IS NULL",
      [quizId, studentId]
    );
    return result.rows[0] ?? null;
  }

  async findByStudent(studentId: string): Promise<QuizAttemptWithDetails[]> {
    const result = await this.db.query(
      `SELECT qa.*,
              q.title AS quiz_title,
              c.title AS course_title,
              c.code AS course_code,
              (SELECT COUNT(*) FROM questions WHERE quiz_id = qa.quiz_id)::int AS total_questions,
              (SELECT COUNT(*) FROM quiz_attempt_answers WHERE attempt_id = qa.id AND is_correct = true)::int AS correct_answers
       FROM quiz_attempts qa
       JOIN quizzes q ON q.id = qa.quiz_id
       JOIN courses c ON c.id = q.course_id
       WHERE qa.student_id = $1
       ORDER BY qa.started_at DESC`,
      [studentId]
    );
    return result.rows;
  }

  async findAnswers(attemptId: string): Promise<QuizAttemptAnswerRow[]> {
    const result = await this.db.query(
      "SELECT * FROM quiz_attempt_answers WHERE attempt_id = $1",
      [attemptId]
    );
    return result.rows;
  }

  async create(quizId: string, studentId: string): Promise<QuizAttemptRow> {
    const result = await this.db.query(
      `INSERT INTO quiz_attempts (quiz_id, student_id, started_at)
       VALUES ($1, $2, NOW())
       RETURNING *`,
      [quizId, studentId]
    );
    return result.rows[0];
  }

  async complete(id: string, score: number): Promise<QuizAttemptRow | null> {
    const result = await this.db.query(
      "UPDATE quiz_attempts SET score = $2, completed_at = NOW() WHERE id = $1 RETURNING *",
      [id, score]
    );
    return result.rows[0] ?? null;
  }

  async saveAnswer(data: {
    attempt_id: string;
    question_id: string;
    selected_answer: string;
    is_correct: boolean;
  }): Promise<QuizAttemptAnswerRow> {
    const result = await this.db.query(
      `INSERT INTO quiz_attempt_answers (attempt_id, question_id, selected_answer, is_correct, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [data.attempt_id, data.question_id, data.selected_answer, data.is_correct]
    );
    return result.rows[0];
  }
}
