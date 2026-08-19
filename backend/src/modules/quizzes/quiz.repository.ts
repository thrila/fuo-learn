import type { Database } from "../../infrastructure/database/index.js";

export interface QuizRow {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  is_published: boolean;
  generation_status: string | null;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface QuestionRow {
  id: string;
  quiz_id: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string | null;
  sort_order: number;
  created_at: Date;
}

export interface QuizWithCourse extends QuizRow {
  course_title: string;
  course_code: string;
}

export class QuizRepository {
  constructor(private db: Database) {}

  async findById(id: string): Promise<QuizRow | null> {
    const result = await this.db.query("SELECT * FROM quizzes WHERE id = $1", [id]);
    return result.rows[0] ?? null;
  }

  async findWithCourse(id: string): Promise<QuizWithCourse | null> {
    const result = await this.db.query(
      `SELECT q.*, c.title AS course_title, c.code AS course_code
       FROM quizzes q
       JOIN courses c ON c.id = q.course_id
       WHERE q.id = $1`,
      [id]
    );
    return result.rows[0] ?? null;
  }

  async findByCourse(courseId: string): Promise<QuizWithCourse[]> {
    const result = await this.db.query(
      `SELECT q.*, c.title AS course_title, c.code AS course_code
       FROM quizzes q
       JOIN courses c ON c.id = q.course_id
       WHERE q.course_id = $1
       ORDER BY q.created_at DESC`,
      [courseId]
    );
    return result.rows;
  }

  async create(data: {
    course_id: string;
    title: string;
    description?: string;
    created_by: string;
  }): Promise<QuizRow> {
    const result = await this.db.query(
      `INSERT INTO quizzes (course_id, title, description, is_published, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, FALSE, $4, NOW(), NOW())
       RETURNING *`,
      [data.course_id, data.title, data.description ?? null, data.created_by]
    );
    return result.rows[0];
  }

  async update(id: string, data: {
    title?: string;
    description?: string;
    is_published?: boolean;
    generation_status?: string;
  }): Promise<QuizRow | null> {
    const sets: string[] = [];
    const params: unknown[] = [];

    if (data.title !== undefined) { params.push(data.title); sets.push(`title = $${params.length}`); }
    if (data.description !== undefined) { params.push(data.description); sets.push(`description = $${params.length}`); }
    if (data.is_published !== undefined) { params.push(data.is_published); sets.push(`is_published = $${params.length}`); }
    if (data.generation_status !== undefined) { params.push(data.generation_status); sets.push(`generation_status = $${params.length}`); }

    if (sets.length === 0) return this.findById(id);

    sets.push("updated_at = NOW()");
    params.push(id);

    const result = await this.db.query(
      `UPDATE quizzes SET ${sets.join(", ")} WHERE id = $${params.length} RETURNING *`,
      params
    );
    return result.rows[0] ?? null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.query("DELETE FROM quizzes WHERE id = $1", [id]);
    return (result.rowCount ?? 0) > 0;
  }

  // Questions

  async findQuestion(id: string): Promise<QuestionRow | null> {
    const result = await this.db.query("SELECT * FROM questions WHERE id = $1", [id]);
    return result.rows[0] ?? null;
  }

  async findQuestionsByQuiz(quizId: string): Promise<QuestionRow[]> {
    const result = await this.db.query(
      "SELECT * FROM questions WHERE quiz_id = $1 ORDER BY sort_order ASC",
      [quizId]
    );
    return result.rows;
  }

  async addQuestion(data: {
    quiz_id: string;
    question: string;
    options: string[];
    correct_answer: string;
    explanation?: string;
    sort_order: number;
  }): Promise<QuestionRow> {
    const result = await this.db.query(
      `INSERT INTO questions (quiz_id, question, options, correct_answer, explanation, sort_order, created_at)
       VALUES ($1, $2, $3::jsonb, $4, $5, $6, NOW())
       RETURNING *`,
      [data.quiz_id, data.question, JSON.stringify(data.options), data.correct_answer, data.explanation ?? null, data.sort_order]
    );
    return result.rows[0];
  }

  async deleteQuestionsByQuiz(quizId: string): Promise<void> {
    await this.db.query("DELETE FROM questions WHERE quiz_id = $1", [quizId]);
  }

  async deleteQuestion(questionId: string): Promise<void> {
    await this.db.query("DELETE FROM questions WHERE id = $1", [questionId]);
  }
}
