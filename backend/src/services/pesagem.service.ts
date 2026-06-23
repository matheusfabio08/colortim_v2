import { db } from '../config/database';
import { activityLogRepository } from '../repositories/activityLog.repository';
import { productionOrderRepository } from '../repositories/productionOrder.repository';
import { NotFoundError } from '../utils/AppError';

export const pesagemService = {
  async getAll() {
    const { rows } = await db.query(`
      SELECT po.*, p.id AS pesagem_id, p.employee_id AS pesagem_employee_id,
             p.notes AS pesagem_notes, p.start_time AS pesagem_start_time,
             p.end_time AS pesagem_end_time, e.name AS pesagem_employee_name
      FROM production_orders po
      LEFT JOIN po_pesagem p ON po.id = p.op_id
      LEFT JOIN employees e ON p.employee_id = e.id
      WHERE po.requires_lab = TRUE
      ORDER BY po.created_at DESC
    `);
    return rows;
  },

  async start(poId: string, employeeId: string, userId: string) {
    const op = await productionOrderRepository.findById(poId);
    if (!op) throw new NotFoundError('Ordem de produção');
    await db.transaction(async (client) => {
      await client.query(`INSERT INTO po_pesagem (op_id, employee_id, start_time) VALUES ($1,$2,NOW()) ON CONFLICT DO NOTHING`, [poId, employeeId]);
      await activityLogRepository.log({ op_id: poId, stage: 'pesagem', action: 'started', user_id: userId }, client);
    });
  },

  async complete(poId: string, notes: string | undefined, userId: string) {
    await db.transaction(async (client) => {
      await client.query(`UPDATE po_pesagem SET end_time = NOW(), notes = $1 WHERE op_id = $2`, [notes ?? null, poId]);
      await activityLogRepository.log({ op_id: poId, stage: 'pesagem', action: 'completed', user_id: userId }, client);
    });
  },

  async getKPIs() {
    const [totalRes, completedRes, pendingRes, avgTimeRes] = await Promise.all([
      db.query(`SELECT COUNT(*)::int AS count FROM po_pesagem`),
      db.query(`SELECT COUNT(*)::int AS count FROM po_pesagem WHERE end_time IS NOT NULL`),
      db.query(`SELECT COUNT(*)::int AS count FROM po_pesagem WHERE end_time IS NULL`),
      db.query(`SELECT ROUND(AVG(EXTRACT(EPOCH FROM (end_time - start_time)) / 3600)::numeric, 1) AS avg_hours FROM po_pesagem WHERE start_time IS NOT NULL AND end_time IS NOT NULL`),
    ]);
    return { total: totalRes.rows[0].count, completed: completedRes.rows[0].count, pending: pendingRes.rows[0].count, avg_hours: avgTimeRes.rows[0].avg_hours ?? 0 };
  },
};
