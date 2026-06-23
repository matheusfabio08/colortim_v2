import { db } from '../config/database';
import { activityLogRepository } from '../repositories/activityLog.repository';
import { productionOrderRepository } from '../repositories/productionOrder.repository';
import { z } from 'zod';
import { BoxSchema } from '../validators/schemas';

export const boxService = {
  async complete(boxNumber: string, input: z.infer<typeof BoxSchema>, userId: string): Promise<void> {
    await db.transaction(async (client) => {
      await client.query(`INSERT INTO po_box_processing (op_id,box_number,employee_id,has_adjustment,adjustment_details,is_reprocess,reprocess_reason,processed_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [input.po_id,boxNumber,input.employee_id,input.has_adjustment,input.adjustment_details??null,input.is_reprocess,input.reprocess_reason??null,input.timestamp]);
      await productionOrderRepository.updateStatus(input.po_id,'producao',boxNumber,client);
      await activityLogRepository.log({ op_id: input.po_id, stage: boxNumber, action: 'completed', user_id: userId }, client);
    });
  },
  async startProgress(boxNumber: string, poId: string): Promise<void> {
    await db.query(`INSERT INTO po_in_progress (op_id,stage) VALUES ($1,$2) ON CONFLICT (op_id,stage) DO NOTHING`, [poId, boxNumber]);
  },
  async finishProgress(boxNumber: string, poId: string): Promise<void> {
    await db.query(`DELETE FROM po_in_progress WHERE op_id=$1 AND stage=$2`, [poId, boxNumber]);
  },
  async getBoxData(boxStatus: string) {
    const { rows } = await db.query(
      `SELECT po.*,pip.id as pip_id,pip.started_at FROM production_orders po LEFT JOIN po_in_progress pip ON po.id=pip.op_id AND pip.stage=$1 WHERE po.status=$1 ORDER BY po.created_at ASC`,
      [boxStatus]
    );
    return { waiting: rows.filter((r: any) => !r.pip_id), inProgress: rows.filter((r: any) => !!r.pip_id) };
  },
};
