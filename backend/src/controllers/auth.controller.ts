import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { env } from '../config/env';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const authController = {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, password } = req.body;
      const result = await authService.login(username, password);
      res.cookie('access_token', result.sessionToken, COOKIE_OPTIONS);
      res.cookie('refresh_token', result.refreshToken, { ...COOKIE_OPTIONS, maxAge: 30 * 24 * 60 * 60 * 1000 });
      res.json(result);
    } catch (e) { next(e); }
  },

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies?.refresh_token ?? req.body?.refreshToken;
      if (!token) { res.status(401).json({ error: 'Refresh token não fornecido' }); return; }
      const result = await authService.refresh(token);
      res.cookie('access_token', result.sessionToken, COOKIE_OPTIONS);
      res.cookie('refresh_token', result.refreshToken, { ...COOKIE_OPTIONS, maxAge: 30 * 24 * 60 * 60 * 1000 });
      res.json(result);
    } catch (e) { next(e); }
  },

  async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (req.user) await authService.logout(req.user.id);
      res.clearCookie('access_token');
      res.clearCookie('refresh_token');
      res.json({ success: true });
    } catch (e) { next(e); }
  },

  async me(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await authService.me(req.user!.id);
      res.json(user);
    } catch (e) { next(e); }
  },
};
