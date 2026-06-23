import { db } from '../config/database';
import { activityLogRepository } from '../repositories/activityLog.repository';
import { NotFoundError } from '../utils/AppError';
import { z } from 'zod';
import { LaboratorySchema } from '../validators/schemas';

export const laboratoryService = {
  async complete(input: z.infer<typeof LaboratorySchema>, userId: string) {
    await db.transaction(async (client) => {
      await client.query(
        `INSERT INTO po_laboratory
          (op_id, num_batches, is_recipe_ready, recipe_origin_date, description, is_approved, start_time, end_time)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [input.po_id, input.num_batches ?? null, input.is_recipe_ready,
         input.recipe_origin_date ?? null, input.description ?? null,
         input.is_approved, input.start_time, input.end_time]
      );
      await activityLogRepository.log({ op_id: input.po_id, stage: 'laboratorio', action: input.is_approved ? 'approved' : 'processed', user_id: userId }, client);
    });
  },

  async getRecords() {
    const { rows } = await db.query(`
      SELECT po.*, lab.id AS lab_record_id, lab.num_batches, lab.is_recipe_ready,
             lab.recipe_origin_date, lab.description AS lab_description, lab.is_approved,
             lab.start_time AS lab_start_time, lab.end_time AS lab_end_time, lab.created_at AS lab_processed_at
      FROM production_orders po
      LEFT JOIN po_laboratory lab ON po.id = lab.op_id
      WHERE po.requires_lab = TRUE AND po.lot_number IS NULL AND po.parent_op_id IS NULL
      ORDER BY po.created_at DESC
    `);
    return rows;
  },

  async deleteRecord(labRecordId: string) {
    const { rowCount } = await db.query('DELETE FROM po_laboratory WHERE id = $1', [labRecordId]);
    if (!rowCount) throw new NotFoundError('Registro de laboratório');
  },

  async getKPIs() {
    const [totalRes, readyRes, newRes, avgRes, totalBatchesRes, onTimeRes, pendingRes] = await Promise.all([
      db.query(`SELECT COUNT(*)::int AS count FROM po_laboratory`),
      db.query(`SELECT COUNT(*)::int AS count FROM po_laboratory WHERE is_recipe_ready = TRUE`),
      db.query(`SELECT COUNT(*)::int AS count FROM po_laboratory WHERE is_recipe_ready = FALSE OR is_recipe_ready IS NULL`),
      db.query(`SELECT ROUND(AVG(num_batches)::numeric,1) AS avg FROM po_laboratory WHERE num_batches IS NOT NULL AND num_batches > 0`),
      db.query(`SELECT COALESCE(SUM(num_batches),0)::int AS total FROM po_laboratory WHERE num_batches IS NOT NULL`),
      db.query(`SELECT COUNT(*)::int AS count FROM po_laboratory WHERE end_time - start_time <= INTERVAL '2 days'`),
      db.query(`SELECT COUNT(*)::int AS count FROM production_orders WHERE requires_lab = TRUE AND lot_number IS NULL AND parent_op_id IS NULL AND id NOT IN (SELECT op_id FROM po_laboratory)`),
    ]);
    return {
      total_completed: totalRes.rows[0].count,
      ready_recipes: readyRes.rows[0].count,
      new_recipes: newRes.rows[0].count,
      avg_batches: avgRes.rows[0].avg ?? 0,
      total_batches: totalBatchesRes.rows[0].total,
      on_time: onTimeRes.rows[0].count,
      pending_ops: pendingRes.rows[0].count,
    };
  },
};
