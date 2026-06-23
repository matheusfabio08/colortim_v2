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
    if (!username || !password) throw new BadRequestError('Usuário e senha são obrigatórios');
    const user = await userRepository.findByUsername(username);
    if (!user || !user.is_active) throw new UnauthorizedError('Usuário ou senha inválidos');
    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) throw new UnauthorizedError('Usuário ou senha inválidos');
    const tokens = signTokenPair({ userId: user.id, username: user.username, role: user.role });
    return { user: { id: user.id, username: user.username, name: user.name, email: user.email, role: user.role, is_active: user.is_active }, tokens };
  },
  async getMe(userId: string): Promise<AuthenticatedUser> {
    const user = await userRepository.findActiveById(userId);
    if (!user) throw new UnauthorizedError('Usuário não encontrado ou inativo');
    return { id: user.id, username: user.username, name: user.name, email: user.email, role: user.role, is_active: user.is_active };
  },
  async createUser(data: { username: string; password: string; name: string; email: string; role: string }): Promise<{ id: string }> {
    const exists = await userRepository.usernameExists(data.username);
    if (exists) throw new ConflictError('Nome de usuário já existe');
    const password_hash = await hashPassword(data.password);
    const user = await userRepository.create({ ...data, password_hash });
    return { id: user.id };
  },
};
