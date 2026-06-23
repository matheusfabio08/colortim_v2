import { userRepository } from '../repositories/user.repository';
import { hashPassword, verifyPassword } from '../utils/password';
import { signTokenPair, TokenPair } from '../utils/jwt';
import { UnauthorizedError, BadRequestError, ConflictError } from '../utils/AppError';
import { AuthenticatedUser } from '../models/types';

export interface LoginResult {
  user: AuthenticatedUser;
  tokens: TokenPair;
}

export const authService = {
  async login(username: string, password: string): Promise<LoginResult> {
    if (!username || !password) throw new BadRequestError('Usu\u00e1rio e senha s\u00e3o obrigat\u00f3rios');
    const user = await userRepository.findByUsername(username);
    if (!user || !user.is_active) throw new UnauthorizedError('Usu\u00e1rio ou senha inv\u00e1lidos');
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) throw new UnauthorizedError('Usu\u00e1rio ou senha inv\u00e1lidos');
    const tokens = signTokenPair({ userId: user.id, username: user.username, role: user.role });
    return { user: { id: user.id, username: user.username, name: user.name, email: user.email, role: user.role, is_active: user.is_active }, tokens };
  },
  async getMe(userId: string): Promise<AuthenticatedUser> {
    const user = await userRepository.findActiveById(userId);
    if (!user) throw new UnauthorizedError('Usu\u00e1rio n\u00e3o encontrado ou inativo');
    return { id: user.id, username: user.username, name: user.name, email: user.email, role: user.role, is_active: user.is_active };
  },
};
