import { db } from '../config/database';
import { activityLogRepository } from '../repositories/activityLog.repository';
import { productionOrderRepository } from '../repositories/productionOrder.repository';
import { z } from 'zod';
import { DryerSchema } from '../validators/schemas';

export const dryerService = {
  async complete(input: z.infer<typeof DryerSchema>, userId: string): Promise<void> {
    await db.transaction(async (client) => {
      await client.query('INSERT INTO po_dryer (op_id,destination) VALUES ($1,$2)', [input.po_id,input.destination]);
      await productionOrderRepository.updateStatus(input.po_id, input.destination, 'secadora', client);
      await activityLogRepository.log({ op_id: input.po_id, stage: 'secadora', action: 'completed', user_id: userId }, client);
    });
  },
};
