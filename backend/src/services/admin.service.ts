import { userRepository } from '../repositories/user.repository';
import { authService } from './auth.service';
import { NotFoundError } from '../utils/AppError';
import { z } from 'zod';
import { UpdateUserSchema } from '../validators/schemas';

export const adminService = {
  async listUsers() {
    return userRepository.findAll();
  },

  async createUser(data: { username: string; password: string; name: string; email: string; role: string }) {
    return authService.createUser(data);
  },

  async updateUser(id: string, data: z.infer<typeof UpdateUserSchema>) {
    const user = await userRepository.findById(id);
    if (!user) throw new NotFoundError('Usuário');
    await userRepository.update(id, data);
  },
};
