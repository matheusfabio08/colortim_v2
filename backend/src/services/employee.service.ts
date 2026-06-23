import { employeeRepository } from '../repositories/employee.repository';
import { NotFoundError } from '../utils/AppError';

export const employeeService = {
  async list(sector?: string) { return employeeRepository.findAll(sector); },
  async create(name: string, sector: string) { return employeeRepository.create(name, sector); },
  async update(id: string, data: any) {
    const emp = await employeeRepository.findById(id);
    if (!emp) throw new NotFoundError('Funcion\u00e1rio');
    await employeeRepository.update(id, data);
    return employeeRepository.findById(id);
  },
  async remove(id: string) {
    const emp = await employeeRepository.findById(id);
    if (!emp) throw new NotFoundError('Funcion\u00e1rio');
    await employeeRepository.delete(id);
  },
};
