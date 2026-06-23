import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { verifyRefreshToken, signAccessToken } from '../utils/jwt';
import { env } from '../config/env';

const COOKIE_OPTS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};

const REFRESH_OPTS = { ...COOKIE_OPTS, maxAge: 30 * 24 * 60 * 60 * 1000, path: '/api/auth/refresh' };

export const authController = {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { username, password } = req.body;
      const result = await authService.login(username, password);
      res.cookie('colortim_access_token', result.tokens.accessToken, COOKIE_OPTS);
      res.cookie('colortim_refresh_token', result.tokens.refreshToken, REFRESH_OPTS);
      res.json({ user: result.user, sessionToken: result.tokens.accessToken });
    } catch (e) { next(e); }
  },
  async me(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.getMe(req.user!.userId);
      res.json(user);
    } catch (e) { next(e); }
  },
  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.cookies?.colortim_refresh_token;
      if (!token) { res.status(401).json({ error: 'Refresh token não fornecido' }); return; }
      const payload = verifyRefreshToken(token);
      const accessToken = signAccessToken({ userId: payload.userId, username: payload.username, role: payload.role });
      res.cookie('colortim_access_token', accessToken, COOKIE_OPTS);
      res.json({ success: true });
    } catch (e) { next(e); }
  },
  async logout(_req: Request, res: Response): Promise<void> {
    res.clearCookie('colortim_access_token', { path: '/' });
    res.clearCookie('colortim_refresh_token', { path: '/api/auth/refresh' });
    res.json({ success: true });
  },
};
