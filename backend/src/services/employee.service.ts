import { employeeRepository } from '../repositories/employee.repository';
import { NotFoundError } from '../utils/AppError';
import { z } from 'zod';
import { CreateEmployeeSchema } from '../validators/schemas';

export const employeeService = {
  async getAll(sector?: string) {
    return employeeRepository.findAll(sector);
  },

  async create(input: z.infer<typeof CreateEmployeeSchema>) {
    return employeeRepository.create(input);
  },

  async update(id: string, data: { name?: string; sector?: string; is_active?: boolean }) {
    const emp = await employeeRepository.findById(id);
    if (!emp) throw new NotFoundError('Funcionário');
    await employeeRepository.update(id, data);
  },

  async delete(id: string) {
    const emp = await employeeRepository.findById(id);
    if (!emp) throw new NotFoundError('Funcionário');
    await employeeRepository.delete(id);
  },
};
