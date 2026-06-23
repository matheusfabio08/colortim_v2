import { Router, Response } from 'express';
import pool from '../db/pool';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.get('/kpis', async (_req: AuthRequest, res: Response): Promise<void> => {
  const today = new Date().toISOString().split('T')[0];
  const active = await pool.query('SELECT COUNT(*) as count FROM production_orders WHERE is_completed = false');
  const overdue = await pool.query('SELECT COUNT(*) as count FROM production_orders WHERE is_completed = false AND expected_date < $1', [today]);
  const completedToday = await pool.query("SELECT COUNT(*) as count FROM production_orders WHERE is_completed = true AND updated_at::date = $1", [today]);
  const total = await pool.query('SELECT COUNT(*) as count FROM production_orders');
  const t = parseInt(total.rows[0].count);
  const ct = parseInt(completedToday.rows[0].count);
  const productivity = t > 0 ? Math.round((ct / t) * 100) : 0;
  res.json({
    active_ops: parseInt(active.rows[0].count),
    overdue_ops: parseInt(overdue.rows[0].count),
    completed_today: ct,
    productivity_rate: productivity,
  });
});

export default router;
