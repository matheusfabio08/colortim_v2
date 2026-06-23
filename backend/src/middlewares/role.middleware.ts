import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { ForbiddenError } from '../utils/AppError';
import { UserRole } from '../models/types';

export function requireRole(...roles: UserRole[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new ForbiddenError('Não autenticado'));
      return;
    }
    if (!roles.includes(req.user.role as UserRole)) {
      next(new ForbiddenError('Acesso negado: permissão insuficiente'));
      return;
    }
    next();
  };
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  return requireRole('Admin')(req, res, next);
}
