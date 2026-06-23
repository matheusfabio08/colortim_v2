import { db } from '../config/database';
import { NotFoundError } from '../utils/AppError';

export const listaSaidaService = {
  async list(date?: string) {
    if (date) {
      const { rows } = await db.query(`SELECT ls.*,po.op_number,po.client,po.color FROM lista_saida ls JOIN production_orders po ON po.id=ls.op_id WHERE ls.exit_date=$1 ORDER BY ls.exit_time`, [date]);
      return rows;
    }
    const { rows } = await db.query(`SELECT ls.*,po.op_number,po.client,po.color FROM lista_saida ls JOIN production_orders po ON po.id=ls.op_id ORDER BY ls.exit_date DESC, ls.exit_time`);
    return rows;
  },
  async upsert(data: { op_id: string; exit_date: string; exit_time?: string; transportadora_id?: string; regiao_id?: string }) {
    const { rows } = await db.query(
      `INSERT INTO lista_saida (op_id,exit_date,exit_time,transportadora_id,regiao_id) VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (op_id) DO UPDATE SET exit_date=$2,exit_time=$3,transportadora_id=$4,regiao_id=$5 RETURNING *`,
      [data.op_id,data.exit_date,data.exit_time??null,data.transportadora_id??null,data.regiao_id??null]
    );
    return rows[0];
  },
  async delete(id: string) {
    const { rowCount } = await db.query('DELETE FROM lista_saida WHERE id=$1', [id]);
    if (!rowCount) throw new NotFoundError('Registro de sa\u00edda');
  },
};
