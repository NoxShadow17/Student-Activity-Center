import { pool } from '../database/postgres';

export interface User {
  id: number;
  email: string;
  password: string;
  role: 'admin' | 'educator' | 'student';
  created_at: Date;
  updated_at: Date;
}

export class UserModel {
  static async create(email: string, passwordHash: string, role: 'admin' | 'educator' | 'student' = 'student'): Promise<User> {
    const query = `
      INSERT INTO users (email, password, role, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      RETURNING id, email, role, created_at, updated_at
    `;

    const values = [email, passwordHash, role];
    const result = await pool.query(query, values);

    return result.rows[0];
  }

  static async findByEmail(email: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);

    return result.rows[0] || null;
  }

  static async findById(id: number): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);

    return result.rows[0] || null;
  }

  static async findAll(): Promise<User[]> {
    const query = 'SELECT id, email, role, created_at FROM users ORDER BY created_at DESC';
    const result = await pool.query(query);

    return result.rows;
  }

  static async delete(id: number): Promise<boolean> {
    const query = 'DELETE FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);

    return (result.rowCount || 0) > 0;
  }

  static async countByRole(): Promise<Record<string, number>> {
    const query = 'SELECT role, COUNT(*) as count FROM users GROUP BY role';
    const result = await pool.query(query);

    const counts: Record<string, number> = {
      admin: 0,
      educator: 0,
      student: 0
    };

    result.rows.forEach(row => {
      counts[row.role] = parseInt(row.count);
    });

    return counts;
  }
}
