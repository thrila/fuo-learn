import type { Database } from "../../infrastructure/database/index.js";

export interface EnrollmentRow {
  id: string;
  course_id: string;
  student_id: string;
  status: "pending" | "approved" | "rejected";
  created_at: Date;
  updated_at: Date;
}

export interface EnrollmentWithDetails extends EnrollmentRow {
  course_title: string;
  course_code: string;
  student_first_name: string;
  student_last_name: string;
  student_email: string;
}

export class EnrollmentRepository {
  constructor(private db: Database) {}

  async findById(id: string): Promise<EnrollmentRow | null> {
    const result = await this.db.query("SELECT * FROM enrollments WHERE id = $1", [id]);
    return result.rows[0] ?? null;
  }

  async findExisting(courseId: string, studentId: string): Promise<EnrollmentRow | null> {
    const result = await this.db.query(
      "SELECT * FROM enrollments WHERE course_id = $1 AND student_id = $2",
      [courseId, studentId]
    );
    return result.rows[0] ?? null;
  }

  async findByCourse(courseId: string): Promise<EnrollmentWithDetails[]> {
    const result = await this.db.query(
      `SELECT e.*,
              c.title AS course_title,
              c.code AS course_code,
              u.first_name AS student_first_name,
              u.last_name AS student_last_name,
              u.email AS student_email
       FROM enrollments e
       JOIN courses c ON c.id = e.course_id
       JOIN users u ON u.id = e.student_id
       WHERE e.course_id = $1
       ORDER BY e.created_at ASC`,
      [courseId]
    );
    return result.rows;
  }

  async findByStudent(studentId: string): Promise<EnrollmentWithDetails[]> {
    const result = await this.db.query(
      `SELECT e.*,
              c.title AS course_title,
              c.code AS course_code,
              u.first_name AS student_first_name,
              u.last_name AS student_last_name,
              u.email AS student_email
       FROM enrollments e
       JOIN courses c ON c.id = e.course_id
       JOIN users u ON u.id = e.student_id
       WHERE e.student_id = $1
       ORDER BY e.created_at DESC`,
      [studentId]
    );
    return result.rows;
  }

  async create(courseId: string, studentId: string): Promise<EnrollmentRow> {
    const result = await this.db.query(
      `INSERT INTO enrollments (course_id, student_id, status, created_at, updated_at)
       VALUES ($1, $2, 'pending', NOW(), NOW())
       RETURNING *`,
      [courseId, studentId]
    );
    return result.rows[0];
  }

  async updateStatus(id: string, status: "pending" | "approved" | "rejected"): Promise<EnrollmentRow | null> {
    const result = await this.db.query(
      "UPDATE enrollments SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *",
      [id, status]
    );
    return result.rows[0] ?? null;
  }
}
