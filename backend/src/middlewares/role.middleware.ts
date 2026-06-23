import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { ForbiddenError } from '../utils/AppError';

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new ForbiddenError('Sem autenticacao'));
    }
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError(`Acesso negado. Roles permitidas: ${roles.join(', ')}`));
    }
    next();
  };
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  return requireRole('Admin')(req, res, next);
}

export function requirePCP(req: AuthRequest, res: Response, next: NextFunction): void {
  return requireRole('Admin', 'PCP')(req, res, next);
}
