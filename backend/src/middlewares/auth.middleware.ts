import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { UnauthorizedError } from '../utils/AppError';
import { userRepository } from '../repositories/user.repository';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    name: string;
    role: string;
  };
}

export async function authMiddleware(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies?.access_token) {
      token = req.cookies.access_token;
    }

    if (!token) throw new UnauthorizedError('Token não fornecido');

    const payload = verifyAccessToken(token);
    const user = await userRepository.findById(payload.userId);

    if (!user || !user.is_active) {
      throw new UnauthorizedError('Usuário inativo ou inexistente');
    }

    req.user = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    };

    next();
  } catch (error) {
    next(error);
  }
}
