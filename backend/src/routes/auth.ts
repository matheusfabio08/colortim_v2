import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../db/pool';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: 'Usuário e senha são obrigatórios' });
    return;
  }

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1 AND is_active = true',
      [username]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Usuário ou senha inválidos' });
      return;
    }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      res.status(401).json({ error: 'Usuário ou senha inválidos' });
      return;
    }

    res.cookie('colortim_session', user.id, {
      httpOnly: false,
      path: '/',
      sameSite: 'lax',
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        is_active: user.is_active,
      },
      sessionToken: user.id,
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  res.json(req.user);
});

router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('colortim_session');
  res.json({ success: true });
});

export default router;
