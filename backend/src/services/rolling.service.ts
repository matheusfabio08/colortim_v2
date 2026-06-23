import { db } from '../config/database';
import { productionOrderRepository } from '../repositories/productionOrder.repository';
import { activityLogRepository } from '../repositories/activityLog.repository';
import { NotFoundError } from '../utils/AppError';
import { z } from 'zod';
import { RollingSchema } from '../validators/schemas';

export const rollingService = {
  async complete(input: z.infer<typeof RollingSchema>, userId: string) {
    const op = await productionOrderRepository.findById(input.po_id);
    if (!op) throw new NotFoundError('Ordem de produção');
    await db.transaction(async (client) => {
      await client.query(
        `INSERT INTO po_rolling (op_id, employee_id, roll_count, notes, processed_at)
         VALUES ($1,$2,$3,$4,$5)`,
        [input.po_id, input.employee_id, input.roll_count ?? null, input.notes ?? null, input.timestamp]
      );
      await productionOrderRepository.updateStatus(input.po_id, 'qualidade', 'enrolagem', client);
      await activityLogRepository.log({ op_id: input.po_id, stage: 'enrolagem', action: 'completed', user_id: userId }, client);
    });
  },
};
