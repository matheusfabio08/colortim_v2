import { configRepository } from '../repositories/config.repository';

type ConfigType = 'fibras' | 'regioes_entrega' | 'transportadoras';

export const configService = {
  async list(type: ConfigType) { return configRepository.findAll(type); },
  async create(type: ConfigType, name: string) { return configRepository.create(type, name); },
  async update(type: ConfigType, id: string, name: string) { return configRepository.update(type, id, name); },
  async delete(type: ConfigType, id: string) { return configRepository.delete(type, id); },
};
