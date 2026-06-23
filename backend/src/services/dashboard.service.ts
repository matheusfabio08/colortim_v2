import { db } from '../config/database';
import { todayISO } from '../utils/dateUtils';

export const dashboardService = {
  async getKPIs() {
    const today = todayISO();
    const [active, overdue, completedToday, stageCount] = await Promise.all([
      db.query(`SELECT COUNT(*) as count FROM production_orders WHERE is_completed=FALSE`),
      db.query(`SELECT COUNT(*) as count FROM production_orders WHERE is_completed=FALSE AND expected_date < $1`, [today]),
      db.query(`SELECT COUNT(*) as count FROM production_orders WHERE is_completed=TRUE AND updated_at::date = $1`, [today]),
      db.query(`SELECT status, COUNT(*) as count FROM production_orders WHERE is_completed=FALSE GROUP BY status`),
    ]);
    const byStage: Record<string, number> = {};
    (stageCount.rows as any[]).forEach(r => { byStage[r.status] = parseInt(r.count); });
    return {
      active_ops: parseInt(active.rows[0].count),
      overdue_ops: parseInt(overdue.rows[0].count),
      completed_today: parseInt(completedToday.rows[0].count),
      by_stage: byStage,
    };
  },

  async getTimeline() {
    const { rows } = await db.query(`
      SELECT op_number, client, color, status, expected_date, priority
      FROM production_orders
      WHERE is_completed=FALSE
      ORDER BY expected_date ASC, priority DESC
      LIMIT 50
    `);
    return rows;
  },
};
