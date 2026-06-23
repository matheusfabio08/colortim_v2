import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { verifyRefreshToken, signAccessToken } from '../utils/jwt';
import { env } from '../config/env';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};

export const authController = {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { username, password } = req.body;
      const result = await authService.login(username, password);
      res.cookie('colortim_access_token', result.tokens.accessToken, COOKIE_OPTIONS);
      res.cookie('colortim_refresh_token', result.tokens.refreshToken, { ...COOKIE_OPTIONS, maxAge: 30 * 24 * 60 * 60 * 1000, path: '/api/auth/refresh' });
      res.json({ user: result.user, sessionToken: result.tokens.accessToken });
    } catch (error) { next(error); }
  },
  async me(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try { res.json(await authService.getMe(req.user!.userId)); } catch (error) { next(error); }
  },
  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.cookies?.colortim_refresh_token;
      if (!token) { res.status(401).json({ error: 'Refresh token n\u00e3o fornecido' }); return; }
      const payload = verifyRefreshToken(token);
      const accessToken = signAccessToken({ userId: payload.userId, username: payload.username, role: payload.role });
      res.cookie('colortim_access_token', accessToken, COOKIE_OPTIONS);
      res.json({ success: true });
    } catch (error) { next(error); }
  },
  async logout(_req: Request, res: Response): Promise<void> {
    res.clearCookie('colortim_access_token', { path: '/' });
    res.clearCookie('colortim_refresh_token', { path: '/api/auth/refresh' });
    res.json({ success: true });
  },
};
