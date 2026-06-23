import { userRepository } from '../repositories/user.repository';
import { hashPassword } from '../utils/password';
import { BadRequestError, NotFoundError, ConflictError } from '../utils/AppError';
import { db } from '../config/database';
import { UserRole } from '../models/types';

const VALID_ROLES: UserRole[] = ['Admin','PCP','Almoxarifado','Preparacao','Producao','Laboratorio','Qualidade','Pesagem'];

export const adminService = {
  async listUsers() { return userRepository.findAll(); },

  async createUser(data: { username: string; password: string; name: string; email: string; role: string }) {
    if (!VALID_ROLES.includes(data.role as UserRole)) throw new BadRequestError(`Role inválida`);
    if (data.password.length < 6) throw new BadRequestError('Senha deve ter pelo menos 6 caracteres');
    if (await userRepository.usernameExists(data.username)) throw new ConflictError('Nome de usuário já existe');
    const password_hash = await hashPassword(data.password);
    const user = await userRepository.create({ ...data, password_hash });
    return { id: user.id, username: user.username, name: user.name, role: user.role };
  },

  async updateUser(id: string, data: { role?: string; is_active?: boolean; name?: string; email?: string }) {
    const user = await userRepository.findById(id);
    if (!user) throw new NotFoundError('Usuário');
    if (data.role && !VALID_ROLES.includes(data.role as UserRole)) throw new BadRequestError('Role inválida');
    await userRepository.update(id, data);
    return { success: true };
  },

  async resetPassword(id: string, newPassword: string) {
    if (!newPassword || newPassword.length < 6) throw new BadRequestError('Senha deve ter pelo menos 6 caracteres');
    const user = await userRepository.findById(id);
    if (!user) throw new NotFoundError('Usuário');
    const password_hash = await hashPassword(newPassword);
    await db.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [password_hash, id]);
    return { success: true };
  },
};
