import { db } from '../config/database';
import { User } from '../models/types';

export const userRepository = {
  async findById(id: string): Promise<User | null> {
    const { rows } = await db.query<User>('SELECT * FROM users WHERE id = $1', [id]);
    return rows[0] ?? null;
  },

  async findByUsername(username: string): Promise<User | null> {
    const { rows } = await db.query<User>('SELECT * FROM users WHERE username = $1', [username]);
    return rows[0] ?? null;
  },

  async findActiveById(id: string): Promise<User | null> {
    const { rows } = await db.query<User>(
      'SELECT id, username, name, email, role, is_active, created_at, updated_at FROM users WHERE id = $1 AND is_active = TRUE',
      [id]
    );
    return rows[0] ?? null;
  },

  async findAll(): Promise<User[]> {
    const { rows } = await db.query<User>(
      'SELECT id, username, name, email, role, is_active, created_at, updated_at FROM users ORDER BY created_at DESC'
    );
    return rows;
  },

  async create(data: { username: string; password_hash: string; name: string; email: string; role: string }): Promise<User> {
    const { rows } = await db.query<User>(
      `INSERT INTO users (username, password_hash, name, email, role) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [data.username, data.password_hash, data.name, data.email, data.role]
    );
    return rows[0];
  },

  async update(id: string, data: { role?: string; is_active?: boolean; name?: string; email?: string }): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;
    if (data.role !== undefined) { fields.push(`role = $${idx++}`); values.push(data.role); }
    if (data.is_active !== undefined) { fields.push(`is_active = $${idx++}`); values.push(data.is_active); }
    if (data.name !== undefined) { fields.push(`name = $${idx++}`); values.push(data.name); }
    if (data.email !== undefined) { fields.push(`email = $${idx++}`); values.push(data.email); }
    if (fields.length === 0) return;
    values.push(id);
    await db.query(`UPDATE users SET ${fields.join(', ')} WHERE id = $${idx}`, values);
  },

  async updatePassword(id: string, password_hash: string): Promise<void> {
    await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [password_hash, id]);
  },

  async usernameExists(username: string): Promise<boolean> {
    const { rows } = await db.query('SELECT 1 FROM users WHERE username = $1', [username]);
    return rows.length > 0;
  },

  async deleteById(id: string): Promise<void> {
    await db.query('DELETE FROM users WHERE id = $1', [id]);
  },
};
