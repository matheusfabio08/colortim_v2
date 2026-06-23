import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JwtPayload } from '../utils/jwt';
import { UnauthorizedError } from '../utils/AppError';

export interface AuthRequest extends Request {
  user?: JwtPayload & { id: string };
}

export function authMiddleware(req: AuthRequest, _res: Response, next: NextFunction): void {
  try {
    const token =
      req.cookies?.colortim_access_token ||
      req.headers.authorization?.replace('Bearer ', '');
    if (!token) throw new UnauthorizedError('Token de autentica\u00e7\u00e3o n\u00e3o fornecido');
    const payload = verifyAccessToken(token);
    req.user = { ...payload, id: payload.userId };
    next();
  } catch (error) {
    next(error);
  }
}
