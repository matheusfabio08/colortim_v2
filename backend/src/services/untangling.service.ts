import { db } from '../config/database';
import { activityLogRepository } from '../repositories/activityLog.repository';
import { productionOrderRepository } from '../repositories/productionOrder.repository';
import { z } from 'zod';
import { UntanglingSchema } from '../validators/schemas';

export const untanglingService = {
  async complete(input: z.infer<typeof UntanglingSchema>, userId: string): Promise<void> {
    await db.transaction(async (client) => {
      await client.query(
        `INSERT INTO po_untangling (op_id,num_employees,meters_per_employee,employee_times,start_time,end_time)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [input.po_id,input.num_employees,input.meters_per_employee,JSON.stringify(input.employee_times),input.start_time,input.end_time]
      );
      await productionOrderRepository.updateStatus(input.po_id, 'enrolagem', 'destrinchagem', client);
      await activityLogRepository.log({ op_id: input.po_id, stage: 'destrinchagem', action: 'completed', user_id: userId }, client);
    });
  },
};
