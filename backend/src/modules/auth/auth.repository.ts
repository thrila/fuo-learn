import type { Database } from "../../infrastructure/database/index.js";

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  role: "admin" | "professor" | "student";
  status: "pending" | "active" | "disabled";
  created_at: Date;
  updated_at: Date;
}

export class UserRepository {
  constructor(private db: Database) {}

  async findById(id: string): Promise<UserRow | null> {
    const result = await this.db.query(
      "SELECT * FROM users WHERE id = $1",
      [id]
    );
    return result.rows[0] ?? null;
  }

  async findByEmail(email: string): Promise<UserRow | null> {
    const result = await this.db.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    return result.rows[0] ?? null;
  }

  async create(data: {
    id: string;
    email: string;
    password_hash: string;
    first_name: string;
    last_name: string;
    role: "admin" | "professor" | "student";
  }): Promise<UserRow> {
    const result = await this.db.query(
      `INSERT INTO users (id, email, password_hash, first_name, last_name, role, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW(), NOW())
       RETURNING *`,
      [data.id, data.email, data.password_hash, data.first_name, data.last_name, data.role]
    );
    return result.rows[0];
  }

  async updateStatus(id: string, status: "active" | "disabled"): Promise<UserRow | null> {
    const result = await this.db.query(
      "UPDATE users SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *",
      [id, status]
    );
    return result.rows[0] ?? null;
  }

  async updateNames(id: string, firstName: string, lastName: string): Promise<UserRow | null> {
    const result = await this.db.query(
      `UPDATE users
       SET first_name = $2, last_name = $3, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, firstName, lastName]
    );
    return result.rows[0] ?? null;
  }

  async listPending(): Promise<UserRow[]> {
    const result = await this.db.query(
      "SELECT * FROM users WHERE status = 'pending' ORDER BY created_at ASC"
    );
    return result.rows;
  }

  async listAll(): Promise<UserRow[]> {
    const result = await this.db.query(
      "SELECT * FROM users ORDER BY created_at DESC"
    );
    return result.rows;
  }
}
