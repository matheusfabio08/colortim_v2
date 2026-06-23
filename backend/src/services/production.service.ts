import { db } from '../config/database';
import { activityLogRepository } from '../repositories/activityLog.repository';
import { productionOrderRepository } from '../repositories/productionOrder.repository';
import { z } from 'zod';
import { ProductionSchema } from '../validators/schemas';

export const productionService = {
  async complete(input: z.infer<typeof ProductionSchema>, userId: string): Promise<void> {
    await db.transaction(async (client) => {
      await client.query(
        `INSERT INTO po_production (op_id,box_number,machine,operator,has_adjustment,start_date,end_date,meters_produced)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [input.po_id,input.box_number,input.machine,input.operator,input.has_adjustment,input.start_date,input.end_date,input.meters_produced]
      );
      await productionOrderRepository.updateStatus(input.po_id, 'secadora', 'producao', client);
      await activityLogRepository.log({ op_id: input.po_id, stage: 'producao', action: 'completed', user_id: userId }, client);
    });
  },
};
