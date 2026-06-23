import { db } from '../config/database';
import { User } from '../models/types';

export const userRepository = {
  async findById(id: string): Promise<User | null> {
    const { rows } = await db.query<User>(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return rows[0] ?? null;
  },

  async findByUsername(username: string): Promise<User | null> {
    const { rows } = await db.query<User>(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    return rows[0] ?? null;
  },

  async findAll(): Promise<Omit<User, 'password_hash'>[]> {
    const { rows } = await db.query(
      'SELECT id, username, name, email, role, is_active, created_at, updated_at FROM users ORDER BY name ASC'
    );
    return rows;
  },

  async usernameExists(username: string): Promise<boolean> {
    const { rows } = await db.query(
      'SELECT 1 FROM users WHERE username = $1', [username]
    );
    return rows.length > 0;
  },

  async create(data: {
    username: string;
    password_hash: string;
    name: string;
    email: string;
    role: string;
  }): Promise<User> {
    const { rows } = await db.query<User>(
      `INSERT INTO users (username, password_hash, name, email, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [data.username, data.password_hash, data.name, data.email, data.role]
    );
    return rows[0];
  },

  async update(id: string, data: Partial<{
    role: string;
    is_active: boolean;
    name: string;
    email: string;
  }>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];
    let i = 1;

    if (data.role !== undefined) { fields.push(`role = $${i++}`); values.push(data.role); }
    if (data.is_active !== undefined) { fields.push(`is_active = $${i++}`); values.push(data.is_active); }
    if (data.name !== undefined) { fields.push(`name = $${i++}`); values.push(data.name); }
    if (data.email !== undefined) { fields.push(`email = $${i++}`); values.push(data.email); }

    if (fields.length === 0) return;
    values.push(id);
    await db.query(
      `UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${i}`,
      values
    );
  },

  async storeRefreshToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    await db.query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE SET token = EXCLUDED.token, expires_at = EXCLUDED.expires_at`,
      [userId, token, expiresAt]
    );
  },

  async findRefreshToken(token: string): Promise<{ user_id: string; expires_at: Date } | null> {
    const { rows } = await db.query(
      'SELECT user_id, expires_at FROM refresh_tokens WHERE token = $1',
      [token]
    );
    return rows[0] ?? null;
  },

  async deleteRefreshToken(token: string): Promise<void> {
    await db.query('DELETE FROM refresh_tokens WHERE token = $1', [token]);
  },

  async deleteAllRefreshTokens(userId: string): Promise<void> {
    await db.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);
  },
};
