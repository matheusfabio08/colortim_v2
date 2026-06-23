import { db } from '../config/database';

type ConfigTable = 'fibras' | 'regioes_entrega' | 'transportadoras';

export const configRepository = {
  async findAll(table: ConfigTable): Promise<any[]> {
    const { rows } = await db.query(`SELECT * FROM ${table} WHERE is_active=TRUE ORDER BY name`);
    return rows;
  },
  async create(table: ConfigTable, name: string): Promise<any> {
    const { rows } = await db.query(`INSERT INTO ${table} (name) VALUES ($1) RETURNING *`, [name]);
    return rows[0];
  },
  async update(table: ConfigTable, id: string, name: string): Promise<void> {
    await db.query(`UPDATE ${table} SET name=$1 WHERE id=$2`, [name, id]);
  },
  async delete(table: ConfigTable, id: string): Promise<void> {
    await db.query(`UPDATE ${table} SET is_active=FALSE WHERE id=$1`, [id]);
  },
};
