import { db } from '../config/database';
import { NotFoundError } from '../utils/AppError';

export const listaSaidaService = {
  async getAll(date?: string) {
    const conditions = ['1=1'];
    const params: any[] = [];
    if (date) { conditions.push(`ls.exit_date = $1`); params.push(date); }
    const { rows } = await db.query(
      `SELECT ls.*, po.op_number, po.client, po.color, po.order_number, po.quantity, po.unit,
              t.name AS transportadora_name, r.name AS regiao_name
       FROM lista_saida ls
       JOIN production_orders po ON ls.op_id = po.id
       LEFT JOIN transportadoras t ON ls.transportadora_id = t.id
       LEFT JOIN regioes_entrega r ON ls.regiao_id = r.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY ls.exit_date DESC, ls.exit_time DESC`, params
    );
    return rows;
  },

  async add(data: { op_id: string; exit_date: string; exit_time?: string; transportadora_id?: string; regiao_id?: string }) {
    const { rows } = await db.query(
      `INSERT INTO lista_saida (op_id, exit_date, exit_time, transportadora_id, regiao_id)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (op_id) DO UPDATE SET exit_date=EXCLUDED.exit_date, exit_time=EXCLUDED.exit_time,
         transportadora_id=EXCLUDED.transportadora_id, regiao_id=EXCLUDED.regiao_id
       RETURNING *`,
      [data.op_id, data.exit_date, data.exit_time ?? null, data.transportadora_id ?? null, data.regiao_id ?? null]
    );
    return rows[0];
  },

  async remove(id: string) {
    const { rowCount } = await db.query('DELETE FROM lista_saida WHERE id = $1', [id]);
    if (!rowCount) throw new NotFoundError('Registro de saída');
  },
};
