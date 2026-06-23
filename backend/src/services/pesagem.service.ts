import { db } from '../config/database';
import { activityLogRepository } from '../repositories/activityLog.repository';
import { NotFoundError } from '../utils/AppError';

export const pesagemService = {
  async getAll() {
    const { rows } = await db.query(
      `SELECT po.*, pesa.id as pesagem_id, pesa.employee_id, pesa.notes, pesa.start_time as pesa_start, pesa.end_time as pesa_end
       FROM production_orders po
       LEFT JOIN po_pesagem pesa ON po.id = pesa.op_id
       WHERE po.recipe_weighed = TRUE OR po.requires_lab = TRUE
       ORDER BY po.created_at DESC`
    );
    return rows;
  },

  async save(op_id: string, data: { employee_id?: string; notes?: string; start_time?: string; end_time?: string }, userId: string): Promise<void> {
    const existing = await db.query('SELECT id FROM po_pesagem WHERE op_id=$1', [op_id]);
    if (existing.rows.length > 0) {
      await db.query(
        `UPDATE po_pesagem SET employee_id=$1,notes=$2,start_time=$3,end_time=$4 WHERE op_id=$5`,
        [data.employee_id??null,data.notes??null,data.start_time??null,data.end_time??null,op_id]
      );
    } else {
      await db.query(
        `INSERT INTO po_pesagem (op_id,employee_id,notes,start_time,end_time) VALUES ($1,$2,$3,$4,$5)`,
        [op_id,data.employee_id??null,data.notes??null,data.start_time??null,data.end_time??null]
      );
    }
    await db.query('UPDATE production_orders SET recipe_weighed=TRUE WHERE id=$1', [op_id]);
    await activityLogRepository.log({ op_id, stage: 'pesagem', action: 'completed', user_id: userId });
  },

  async delete(pesagemId: string): Promise<void> {
    const { rows } = await db.query('SELECT op_id FROM po_pesagem WHERE id=$1', [pesagemId]);
    if (!rows.length) throw new NotFoundError('Registro de pesagem');
    await db.query('DELETE FROM po_pesagem WHERE id=$1', [pesagemId]);
    await db.query('UPDATE production_orders SET recipe_weighed=FALSE WHERE id=$1', [rows[0].op_id]);
  },
};
