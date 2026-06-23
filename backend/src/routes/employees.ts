import { Router, Response } from 'express';
import pool from '../db/pool';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { CreateEmployeeRequestSchema } from '../shared/types';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { sector } = req.query;
  let query = 'SELECT * FROM employees WHERE is_active = true';
  const params: any[] = [];
  if (sector && sector !== 'Todos') { query += ' AND (sector = $1 OR sector = $2)'; params.push(sector, 'Todos'); }
  query += ' ORDER BY sector, name';
  const r = await pool.query(query, params);
  res.json(r.rows);
});

router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const validated = CreateEmployeeRequestSchema.parse(req.body);
  await pool.query('INSERT INTO employees (name, sector) VALUES ($1, $2)', [validated.name, validated.sector]);
  res.status(201).json({ success: true });
});

router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, sector, is_active } = req.body;
  await pool.query('UPDATE employees SET name=$1, sector=$2, is_active=$3, updated_at=NOW() WHERE id=$4', [name, sector, is_active, id]);
  res.json({ success: true });
});

router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  await pool.query('DELETE FROM employees WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

export default router;
