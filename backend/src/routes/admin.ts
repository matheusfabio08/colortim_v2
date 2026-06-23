import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../db/pool';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.get('/users', async (_req: AuthRequest, res: Response): Promise<void> => {
  const r = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
  res.json(r.rows);
});

router.post('/users', async (req: AuthRequest, res: Response): Promise<void> => {
  const currentUser = req.user;
  if (currentUser.role !== 'Admin') { res.status(403).json({ error: 'Apenas administradores podem criar usuários' }); return; }
  const { username, password, name, email, role } = req.body;
  if (!username || !password || !name || !email || !role) { res.status(400).json({ error: 'Todos os campos são obrigatórios' }); return; }
  const existing = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
  if (existing.rows.length > 0) { res.status(400).json({ error: 'Nome de usuário já existe' }); return; }
  const passwordHash = await bcrypt.hash(password, 10);
  const result = await pool.query(
    'INSERT INTO users (username, password_hash, name, email, role) VALUES ($1,$2,$3,$4,$5) RETURNING id',
    [username, passwordHash, name, email, role]
  );
  res.status(201).json({ success: true, id: result.rows[0].id });
});

router.put('/users/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { role, is_active } = req.body;
  await pool.query('UPDATE users SET role=$1, is_active=$2, updated_at=NOW() WHERE id=$3', [role, is_active, id]);
  res.json({ success: true });
});

export default router;
