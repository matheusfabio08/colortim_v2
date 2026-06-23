import { db } from '../config/database';
import { productionOrderRepository } from '../repositories/productionOrder.repository';
import { activityLogRepository } from '../repositories/activityLog.repository';
import { NotFoundError } from '../utils/AppError';

export const pcpService = {
  async getAll() {
    const { rows } = await db.query(`
      SELECT po.*, ps.sheet_number, f.name AS fiber_name, f2.name AS fiber2_name
      FROM production_orders po
      JOIN production_sheets ps ON po.sheet_id = ps.id
      LEFT JOIN fibras f  ON po.fiber_id  = f.id
      LEFT JOIN fibras f2 ON po.fiber2_id = f2.id
      WHERE po.lot_number IS NULL AND po.parent_op_id IS NULL
      ORDER BY po.created_at DESC
    `);
    return rows;
  },

  async getByStatus(status: string) {
    const { rows } = await db.query(
      `SELECT po.*, ps.sheet_number FROM production_orders po
       JOIN production_sheets ps ON po.sheet_id = ps.id
       WHERE po.status = $1
       ORDER BY po.sequence_order ASC NULLS LAST, po.created_at ASC`, [status]
    );
    return rows;
  },

  async updatePriority(id: string, priority: number, priorityNotes: string | undefined, userId: string) {
    const op = await productionOrderRepository.findById(id);
    if (!op) throw new NotFoundError('Ordem de produção');
    await productionOrderRepository.updatePriority(id, priority, priorityNotes);
    await activityLogRepository.log({ op_id: id, stage: 'pcp', action: 'priority_updated', user_id: userId, details: `Prioridade: ${priority}` });
    return { success: true };
  },

  async updateSequenceOrder(id: string, sequenceOrder: number) {
    const op = await productionOrderRepository.findById(id);
    if (!op) throw new NotFoundError('Ordem de produção');
    await productionOrderRepository.updateSequenceOrder(id, sequenceOrder);
    return { success: true };
  },

  async getKPIs() {
    const today = new Date().toISOString().split('T')[0];
    const [activeRes, overdueRes, completedTodayRes, stagesRes] = await Promise.all([
      db.query(`SELECT COUNT(*)::int AS count FROM production_orders WHERE is_completed = FALSE`),
      db.query(`SELECT COUNT(*)::int AS count FROM production_orders WHERE is_completed = FALSE AND expected_date < $1`, [today]),
      db.query(`SELECT COUNT(*)::int AS count FROM production_orders WHERE is_completed = TRUE AND updated_at::date = $1`, [today]),
      db.query(`SELECT status, COUNT(*)::int AS count FROM production_orders WHERE is_completed = FALSE GROUP BY status`),
    ]);
    const byStage: Record<string, number> = {};
    for (const row of stagesRes.rows) byStage[row.status] = row.count;
    return { active_ops: activeRes.rows[0].count, overdue_ops: overdueRes.rows[0].count, completed_today: completedTodayRes.rows[0].count, by_stage: byStage };
  },
};
