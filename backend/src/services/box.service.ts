import { db } from '../config/database';
import { activityLogRepository } from '../repositories/activityLog.repository';
import { productionOrderRepository } from '../repositories/productionOrder.repository';
import { z } from 'zod';
import { BoxSchema, StartInProgressSchema } from '../validators/schemas';

export const boxService = {
  async getRecords(boxNumber: string) {
    const { rows: all } = await db.query(
      `SELECT po.*, pip.id as pip_id, pip.started_at
       FROM production_orders po
       LEFT JOIN po_in_progress pip ON po.id = pip.op_id AND pip.stage = $1
       WHERE po.status = $1 AND po.is_completed = FALSE
       ORDER BY po.created_at ASC`,
      [boxNumber]
    );
    const waiting = all.filter((r: any) => !r.pip_id);
    const inProgress = all.filter((r: any) => !!r.pip_id);
    const { rows: completed } = await db.query(
      `SELECT po.* FROM production_orders po
       JOIN po_box_processing bp ON po.id = bp.op_id
       WHERE bp.box_number = $1 AND bp.created_at > NOW() - INTERVAL '24 hours'
       ORDER BY bp.created_at DESC`,
      [boxNumber]
    );
    return { waiting, inProgress, completed };
  },

  async startInProgress(input: z.infer<typeof StartInProgressSchema>, _userId: string): Promise<void> {
    await db.query(
      `INSERT INTO po_in_progress (op_id,stage,box_number,machine) VALUES ($1,$2,$3,$4)
       ON CONFLICT (op_id,stage) DO NOTHING`,
      [input.po_id,input.stage,input.box_number??null,input.machine??null]
    );
  },

  async complete(boxNumber: string, input: z.infer<typeof BoxSchema>, userId: string): Promise<void> {
    const nextStatus = boxNumber === 'box4' ? 'box5' : boxNumber === 'box5' ? 'box6' : 'producao';
    await db.transaction(async (client) => {
      await client.query(
        `INSERT INTO po_box_processing (op_id,box_number,employee_id,has_adjustment,adjustment_details,is_reprocess,reprocess_reason,processed_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [input.po_id,boxNumber,input.employee_id,input.has_adjustment,input.adjustment_details??null,input.is_reprocess,input.reprocess_reason??null,input.timestamp]
      );
      await client.query('DELETE FROM po_in_progress WHERE op_id=$1 AND stage=$2', [input.po_id,boxNumber]);
      await productionOrderRepository.updateStatus(input.po_id, nextStatus, boxNumber, client);
      await activityLogRepository.log({ op_id: input.po_id, stage: boxNumber, action: 'completed', user_id: userId }, client);
    });
  },
};
