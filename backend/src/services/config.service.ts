import { db } from '../config/database';
import { NotFoundError, ConflictError } from '../utils/AppError';

type ConfigTable = 'fibras' | 'regioes_entrega' | 'transportadoras';

async function listItems(table: ConfigTable) {
  const { rows } = await db.query(`SELECT * FROM ${table} ORDER BY name ASC`);
  return rows;
}
async function createItem(table: ConfigTable, name: string) {
  try {
    const { rows } = await db.query(`INSERT INTO ${table} (name) VALUES ($1) RETURNING *`, [name]);
    return rows[0];
  } catch (e: any) {
    if (e.code === '23505') throw new ConflictError(`${name} já existe`);
    throw e;
  }
}
async function toggleItem(table: ConfigTable, id: string) {
  const { rows } = await db.query(`UPDATE ${table} SET is_active = NOT is_active WHERE id = $1 RETURNING *`, [id]);
  if (!rows[0]) throw new NotFoundError('Item');
  return rows[0];
}
async function deleteItem(table: ConfigTable, id: string) {
  const { rowCount } = await db.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
  if (!rowCount) throw new NotFoundError('Item');
}

export const configService = {
  fibras: { list: () => listItems('fibras'), create: (n: string) => createItem('fibras', n), toggle: (id: string) => toggleItem('fibras', id), delete: (id: string) => deleteItem('fibras', id) },
  regioes: { list: () => listItems('regioes_entrega'), create: (n: string) => createItem('regioes_entrega', n), toggle: (id: string) => toggleItem('regioes_entrega', id), delete: (id: string) => deleteItem('regioes_entrega', id) },
  transportadoras: { list: () => listItems('transportadoras'), create: (n: string) => createItem('transportadoras', n), toggle: (id: string) => toggleItem('transportadoras', id), delete: (id: string) => deleteItem('transportadoras', id) },
  employees: {
    list: async (sector?: string) => {
      const params: any[] = [];
      let where = 'is_active = TRUE';
      if (sector) { where += ' AND sector = $1'; params.push(sector); }
      const { rows } = await db.query(`SELECT * FROM employees WHERE ${where} ORDER BY name ASC`, params);
      return rows;
    },
    create: async (name: string, sector: string) => {
      const { rows } = await db.query(`INSERT INTO employees (name, sector) VALUES ($1,$2) RETURNING *`, [name, sector]);
      return rows[0];
    },
    delete: async (id: string) => {
      const { rowCount } = await db.query('DELETE FROM employees WHERE id = $1', [id]);
      if (!rowCount) throw new NotFoundError('Funcionário');
    },
  },
};
