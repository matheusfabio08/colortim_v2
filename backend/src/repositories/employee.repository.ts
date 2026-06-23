import { db } from '../config/database';
import { Employee } from '../models/types';

export const employeeRepository = {
  async findAll(sector?: string): Promise<Employee[]> {
    if (sector) {
      const { rows } = await db.query<Employee>('SELECT * FROM employees WHERE sector=$1 AND is_active=TRUE ORDER BY name', [sector]);
      return rows;
    }
    const { rows } = await db.query<Employee>('SELECT * FROM employees WHERE is_active=TRUE ORDER BY name');
    return rows;
  },

  async findById(id: string): Promise<Employee | null> {
    const { rows } = await db.query<Employee>('SELECT * FROM employees WHERE id=$1', [id]);
    return rows[0] ?? null;
  },

  async create(data: { name: string; sector: string }): Promise<Employee> {
    const { rows } = await db.query<Employee>(
      'INSERT INTO employees (name,sector) VALUES ($1,$2) RETURNING *',
      [data.name,data.sector]
    );
    return rows[0];
  },

  async update(id: string, data: { name?: string; sector?: string; is_active?: boolean }): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;
    if (data.name !== undefined) { fields.push(`name=$${idx++}`); values.push(data.name); }
    if (data.sector !== undefined) { fields.push(`sector=$${idx++}`); values.push(data.sector); }
    if (data.is_active !== undefined) { fields.push(`is_active=$${idx++}`); values.push(data.is_active); }
    if (fields.length === 0) return;
    values.push(id);
    await db.query(`UPDATE employees SET ${fields.join(',')} WHERE id=$${idx}`, values);
  },

  async delete(id: string): Promise<void> {
    await db.query('UPDATE employees SET is_active=FALSE WHERE id=$1', [id]);
  },
};
