import { db } from '../config/database';

export const configRepository = {
  async getFibras() {
    const { rows } = await db.query('SELECT * FROM fibras WHERE is_active=TRUE ORDER BY name');
    return rows;
  },
  async createFibra(name: string) {
    const { rows } = await db.query('INSERT INTO fibras (name) VALUES ($1) RETURNING *', [name]);
    return rows[0];
  },
  async updateFibra(id: string, data: { name?: string; is_active?: boolean }) {
    const fields: string[] = []; const values: any[] = []; let idx = 1;
    if (data.name !== undefined) { fields.push(`name=$${idx++}`); values.push(data.name); }
    if (data.is_active !== undefined) { fields.push(`is_active=$${idx++}`); values.push(data.is_active); }
    if (fields.length === 0) return;
    values.push(id);
    await db.query(`UPDATE fibras SET ${fields.join(',')} WHERE id=$${idx}`, values);
  },
  async deleteFibra(id: string) {
    await db.query('UPDATE fibras SET is_active=FALSE WHERE id=$1', [id]);
  },
  async getRegioes() {
    const { rows } = await db.query('SELECT * FROM regioes_entrega WHERE is_active=TRUE ORDER BY name');
    return rows;
  },
  async createRegiao(name: string) {
    const { rows } = await db.query('INSERT INTO regioes_entrega (name) VALUES ($1) RETURNING *', [name]);
    return rows[0];
  },
  async deleteRegiao(id: string) {
    await db.query('UPDATE regioes_entrega SET is_active=FALSE WHERE id=$1', [id]);
  },
  async getTransportadoras() {
    const { rows } = await db.query('SELECT * FROM transportadoras WHERE is_active=TRUE ORDER BY name');
    return rows;
  },
  async createTransportadora(name: string) {
    const { rows } = await db.query('INSERT INTO transportadoras (name) VALUES ($1) RETURNING *', [name]);
    return rows[0];
  },
  async deleteTransportadora(id: string) {
    await db.query('UPDATE transportadoras SET is_active=FALSE WHERE id=$1', [id]);
  },
};
