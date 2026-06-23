import { Request, Response, NextFunction } from 'express';
import pool from '../db/pool';

export interface AuthRequest extends Request {
  user?: any;
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const sessionId = req.cookies?.colortim_session || req.headers['x-session-token'];

  if (!sessionId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const result = await pool.query(
      'SELECT id, username, name, email, role, is_active FROM users WHERE id = $1 AND is_active = true',
      [sessionId]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    req.user = result.rows[0];
    next();
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
