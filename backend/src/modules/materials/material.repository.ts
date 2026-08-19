import type { Database } from "../../infrastructure/database/index.js";

export interface MaterialRow {
  id: string;
  course_id: string;
  title: string;
  file_url: string;
  file_type: string;
  file_key: string;
  uploaded_by: string;
  created_at: Date;
}

export interface MaterialWithUploader extends MaterialRow {
  uploader_first_name: string;
  uploader_last_name: string;
}

export class MaterialRepository {
  constructor(private db: Database) {}

  async findById(id: string): Promise<MaterialRow | null> {
    const result = await this.db.query("SELECT * FROM materials WHERE id = $1", [id]);
    return result.rows[0] ?? null;
  }

  async findByCourse(courseId: string): Promise<MaterialWithUploader[]> {
    const result = await this.db.query(
      `SELECT m.*,
              u.first_name AS uploader_first_name,
              u.last_name AS uploader_last_name
       FROM materials m
       JOIN users u ON u.id = m.uploaded_by
       WHERE m.course_id = $1
       ORDER BY m.created_at DESC`,
      [courseId]
    );
    return result.rows;
  }

  async create(data: {
    course_id: string;
    title: string;
    file_url: string;
    file_type: string;
    file_key: string;
    uploaded_by: string;
  }): Promise<MaterialRow> {
    const result = await this.db.query(
      `INSERT INTO materials (course_id, title, file_url, file_type, file_key, uploaded_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [data.course_id, data.title, data.file_url, data.file_type, data.file_key, data.uploaded_by]
    );
    return result.rows[0];
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.query("DELETE FROM materials WHERE id = $1", [id]);
    return (result.rowCount ?? 0) > 0;
  }
}
