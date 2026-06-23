import { db } from '../config/database';
import { activityLogRepository } from '../repositories/activityLog.repository';
import { productionOrderRepository } from '../repositories/productionOrder.repository';
import { z } from 'zod';
import { RollingSchema } from '../validators/schemas';

export const rollingService = {
  async complete(input: z.infer<typeof RollingSchema>, userId: string): Promise<void> {
    await db.transaction(async (client) => {
      await client.query(
        `INSERT INTO po_rolling (op_id,employee_ids,num_splices,num_rolls,issue_description,start_time,end_time)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [input.po_id,JSON.stringify(input.employee_ids),input.num_splices,input.num_rolls,input.issue_description??null,input.start_time,input.end_time]
      );
      await productionOrderRepository.updateStatus(input.po_id, 'qualidade', 'enrolagem', client);
      await activityLogRepository.log({ op_id: input.po_id, stage: 'enrolagem', action: 'completed', user_id: userId }, client);
    });
  },
};
