import { userRepository } from '../repositories/user.repository';
import { authService } from './auth.service';
import { NotFoundError } from '../utils/AppError';

export const adminService = {
  async listUsers() {
    return userRepository.findAll();
  },
  async createUser(data: any) {
    return authService.createUser(data);
  },
  async updateUser(id: string, data: any) {
    const user = await userRepository.findById(id);
    if (!user) throw new NotFoundError('Usu\u00e1rio');
    await userRepository.update(id, data);
    return userRepository.findActiveById(id);
  },
};
