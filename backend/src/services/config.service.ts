import { configRepository } from '../repositories/config.repository';

export const configService = {
  getFibras: () => configRepository.getFibras(),
  createFibra: (name: string) => configRepository.createFibra(name),
  updateFibra: (id: string, data: any) => configRepository.updateFibra(id, data),
  deleteFibra: (id: string) => configRepository.deleteFibra(id),
  getRegioes: () => configRepository.getRegioes(),
  createRegiao: (name: string) => configRepository.createRegiao(name),
  deleteRegiao: (id: string) => configRepository.deleteRegiao(id),
  getTransportadoras: () => configRepository.getTransportadoras(),
  createTransportadora: (name: string) => configRepository.createTransportadora(name),
  deleteTransportadora: (id: string) => configRepository.deleteTransportadora(id),
};
