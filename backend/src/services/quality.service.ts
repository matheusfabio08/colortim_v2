import { db } from '../config/database';
import { activityLogRepository } from '../repositories/activityLog.repository';
import { productionOrderRepository } from '../repositories/productionOrder.repository';
import { z } from 'zod';
import { QualitySchema } from '../validators/schemas';

export const qualityService = {
  async complete(input: z.infer<typeof QualitySchema>, userId: string): Promise<void> {
    await db.transaction(async (client) => {
      await client.query(`INSERT INTO po_quality (op_id,rolls_sent,meters_per_roll,discrepancy) VALUES ($1,$2,$3,$4)`,
        [input.po_id,input.rolls_sent,input.meters_per_roll,input.discrepancy??null]);
      await productionOrderRepository.markCompleted(input.po_id, client);
      await activityLogRepository.log({ op_id: input.po_id, stage: 'qualidade', action: 'completed', user_id: userId }, client);
    });
  },
};
