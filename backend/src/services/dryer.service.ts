import { db } from '../config/database';
import { productionOrderRepository } from '../repositories/productionOrder.repository';
import { activityLogRepository } from '../repositories/activityLog.repository';
import { NotFoundError } from '../utils/AppError';
import { z } from 'zod';
import { DryerSchema } from '../validators/schemas';

export const dryerService = {
  async complete(input: z.infer<typeof DryerSchema>, userId: string) {
    const op = await productionOrderRepository.findById(input.po_id);
    if (!op) throw new NotFoundError('Ordem de produção');
    await db.transaction(async (client) => {
      await client.query(
        `INSERT INTO po_dryer (op_id, employee_id, temperature, notes, processed_at)
         VALUES ($1,$2,$3,$4,$5)`,
        [input.po_id, input.employee_id, input.temperature ?? null, input.notes ?? null, input.timestamp]
      );
      await productionOrderRepository.updateStatus(input.po_id, 'destrinchagem', 'secadora', client);
      await activityLogRepository.log({ op_id: input.po_id, stage: 'secadora', action: 'completed', user_id: userId }, client);
    });
  },
};
