import type { Database } from "../../infrastructure/database/index.js";

export interface CourseRow {
  id: string;
  title: string;
  description: string | null;
  code: string;
  professor_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface CourseWithProfessor extends CourseRow {
  professor_first_name: string;
  professor_last_name: string;
  professor_email: string;
}

export class CourseRepository {
  constructor(private db: Database) {}

  async findById(id: string): Promise<CourseWithProfessor | null> {
    const result = await this.db.query(
      `SELECT c.*,
              u.first_name AS professor_first_name,
              u.last_name AS professor_last_name,
              u.email AS professor_email
       FROM courses c
       JOIN users u ON u.id = c.professor_id
       WHERE c.id = $1`,
      [id]
    );
    return result.rows[0] ?? null;
  }

  async findByCode(code: string): Promise<CourseRow | null> {
    const result = await this.db.query(
      "SELECT * FROM courses WHERE code = $1",
      [code]
    );
    return result.rows[0] ?? null;
  }

  async findMany(filters?: { professorId?: string }): Promise<CourseWithProfessor[]> {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filters?.professorId) {
      params.push(filters.professorId);
      conditions.push(`c.professor_id = $${params.length}`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const result = await this.db.query(
      `SELECT c.*,
              u.first_name AS professor_first_name,
              u.last_name AS professor_last_name,
              u.email AS professor_email
       FROM courses c
       JOIN users u ON u.id = c.professor_id
       ${where}
       ORDER BY c.created_at DESC`,
      params
    );
    return result.rows;
  }

  async create(data: {
    title: string;
    description?: string;
    code: string;
    professor_id: string;
  }): Promise<CourseRow> {
    const result = await this.db.query(
      `INSERT INTO courses (title, description, code, professor_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING *`,
      [data.title, data.description ?? null, data.code, data.professor_id]
    );
    return result.rows[0];
  }

  async update(id: string, data: {
    title?: string;
    description?: string;
    code?: string;
    professor_id?: string;
  }): Promise<CourseRow | null> {
    const sets: string[] = [];
    const params: unknown[] = [id];

    if (data.title !== undefined) { params.push(data.title); sets.push(`title = $${params.length}`); }
    if (data.description !== undefined) { params.push(data.description); sets.push(`description = $${params.length}`); }
    if (data.code !== undefined) { params.push(data.code); sets.push(`code = $${params.length}`); }
    if (data.professor_id !== undefined) { params.push(data.professor_id); sets.push(`professor_id = $${params.length}`); }

    if (sets.length === 0) return this.findById(id);

    sets.push("updated_at = NOW()");
    params.push(id);

    const result = await this.db.query(
      `UPDATE courses SET ${sets.join(", ")} WHERE id = $${params.length} RETURNING *`,
      params
    );
    return result.rows[0] ?? null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.query("DELETE FROM courses WHERE id = $1", [id]);
    return (result.rowCount ?? 0) > 0;
  }
}
