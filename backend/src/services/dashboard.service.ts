import { db } from '../config/database';

export const dashboardService = {
  async getKPIs() {
    const today = new Date().toISOString().split('T')[0];
    const [activeRes, overdueRes, completedTodayRes, stagesRes, urgentRes] = await Promise.all([
      db.query(`SELECT COUNT(*)::int AS count FROM production_orders WHERE is_completed = FALSE`),
      db.query(`SELECT COUNT(*)::int AS count FROM production_orders WHERE is_completed = FALSE AND expected_date < $1`, [today]),
      db.query(`SELECT COUNT(*)::int AS count FROM production_orders WHERE is_completed = TRUE AND updated_at::date = $1`, [today]),
      db.query(`SELECT status, COUNT(*)::int AS count FROM production_orders WHERE is_completed = FALSE GROUP BY status ORDER BY count DESC`),
      db.query(`SELECT COUNT(*)::int AS count FROM production_orders WHERE is_completed = FALSE AND priority >= 3`),
    ]);
    const active = activeRes.rows[0].count;
    const completed = completedTodayRes.rows[0].count;
    return {
      active_ops: active, overdue_ops: overdueRes.rows[0].count, completed_today: completed,
      urgent_ops: urgentRes.rows[0].count,
      productivity_rate: active > 0 ? Math.round((completed / (active + completed)) * 100) : 0,
      by_stage: stagesRes.rows,
    };
  },

  async getRecentActivity() {
    const { rows } = await db.query(`
      SELECT al.*, po.op_number, po.client, po.color, u.name AS user_name
      FROM activity_log al
      JOIN production_orders po ON al.op_id = po.id
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC LIMIT 50
    `);
    return rows;
  },

  async getProductionTimeline() {
    const { rows } = await db.query(`
      SELECT DATE_TRUNC('day', created_at)::date AS date, COUNT(*)::int AS completed
      FROM production_orders
      WHERE is_completed = TRUE AND created_at >= NOW() - INTERVAL '30 days'
      GROUP BY 1 ORDER BY 1 ASC
    `);
    return rows;
  },
};
