import { db } from '../config/database';
import { productionOrderRepository } from '../repositories/productionOrder.repository';
import { todayISO } from '../utils/dateUtils';

export const dashboardService = {
  async getKPIs() {
    const today = todayISO();
    const [active, overdue, completedToday, statusCounts] = await Promise.all([
      db.query(`SELECT COUNT(*) as c FROM production_orders WHERE is_completed=FALSE`),
      db.query(`SELECT COUNT(*) as c FROM production_orders WHERE is_completed=FALSE AND expected_date<$1`, [today]),
      db.query(`SELECT COUNT(*) as c FROM production_orders WHERE is_completed=TRUE AND updated_at::date=$1`, [today]),
      productionOrderRepository.countByStatus(),
    ]);
    return {
      active_ops: parseInt(active.rows[0].c),
      overdue_ops: parseInt(overdue.rows[0].c),
      completed_today: parseInt(completedToday.rows[0].c),
      status_counts: statusCounts,
    };
  },
  async getPCPData() {
    const { rows } = await db.query(
      `SELECT * FROM production_orders WHERE is_completed=FALSE ORDER BY priority DESC, expected_date ASC`
    );
    return rows;
  },
};
