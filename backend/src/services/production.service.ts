import { db } from '../config/database';
import { productionOrderRepository } from '../repositories/productionOrder.repository';
import { activityLogRepository } from '../repositories/activityLog.repository';
import { NotFoundError } from '../utils/AppError';
import { z } from 'zod';
import { ProductionSchema } from '../validators/schemas';

export const productionService = {
  async complete(input: z.infer<typeof ProductionSchema>, userId: string) {
    const op = await productionOrderRepository.findById(input.po_id);
    if (!op) throw new NotFoundError('Ordem de produção');
    await db.transaction(async (client) => {
      await client.query(
        `INSERT INTO po_production (op_id, employee_id, machine_id, weight, notes, processed_at)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [input.po_id, input.employee_id, input.machine_id ?? null, input.weight ?? null, input.notes ?? null, input.timestamp]
      );
      await productionOrderRepository.updateStatus(input.po_id, 'secadora', 'producao', client);
      await activityLogRepository.log({ op_id: input.po_id, stage: 'producao', action: 'completed', user_id: userId }, client);
    });
  },
};
