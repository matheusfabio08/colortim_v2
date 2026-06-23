import { db } from '../config/database';
import { NotFoundError } from '../utils/AppError';
import { z } from 'zod';
import { ListaSaidaSchema } from '../validators/schemas';

export const listaSaidaService = {
  async getAll() {
    const { rows } = await db.query(`
      SELECT ls.*, po.op_number, po.client, po.color, po.quantity, po.unit,
             t.name as transportadora_name, r.name as regiao_name
      FROM lista_saida ls
      JOIN production_orders po ON ls.op_id = po.id
      LEFT JOIN transportadoras t ON ls.transportadora_id = t.id
      LEFT JOIN regioes_entrega r ON ls.regiao_id = r.id
      ORDER BY ls.exit_date DESC
    `);
    return rows;
  },

  async create(input: z.infer<typeof ListaSaidaSchema>): Promise<void> {
    await db.query(
      `INSERT INTO lista_saida (op_id,exit_date,exit_time,transportadora_id,regiao_id)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (op_id) DO UPDATE SET exit_date=$2,exit_time=$3,transportadora_id=$4,regiao_id=$5`,
      [input.op_id,input.exit_date,input.exit_time??null,input.transportadora_id??null,input.regiao_id??null]
    );
  },

  async delete(id: string): Promise<void> {
    const { rowCount } = await db.query('DELETE FROM lista_saida WHERE id=$1', [id]);
    if (!rowCount) throw new NotFoundError('Registro de saída');
  },
};
