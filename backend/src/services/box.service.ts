import { db } from '../config/database';
import { activityLogRepository } from '../repositories/activityLog.repository';
import { productionOrderRepository } from '../repositories/productionOrder.repository';
import { NotFoundError } from '../utils/AppError';
import { z } from 'zod';
import { BoxSchema } from '../validators/schemas';

type BoxNumber = 'box4' | 'box5' | 'box6';

export const boxService = {
  async getRecords(boxNumber: BoxNumber) {
    return productionOrderRepository.getBoxRecords(boxNumber);
  },

  async startProcessing(poId: string, boxNumber: BoxNumber, userId: string) {
    const op = await productionOrderRepository.findById(poId);
    if (!op) throw new NotFoundError('Ordem de produção');
    await db.transaction(async (client) => {
      await client.query(`INSERT INTO po_in_progress (op_id, stage) VALUES ($1,$2) ON CONFLICT (op_id, stage) DO NOTHING`, [poId, boxNumber]);
      await activityLogRepository.log({ op_id: poId, stage: boxNumber, action: 'started', user_id: userId }, client);
    });
  },

  async complete(input: z.infer<typeof BoxSchema>, boxNumber: BoxNumber, userId: string) {
    const nextStatus = boxNumber === 'box4' ? 'box5' : boxNumber === 'box5' ? 'box6' : 'producao';
    await db.transaction(async (client) => {
      await client.query(
        `INSERT INTO po_box_processing (op_id, box_number, employee_id, has_adjustment, adjustment_details, is_reprocess, reprocess_reason, processed_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [input.po_id, boxNumber, input.employee_id, input.has_adjustment, input.adjustment_details ?? null, input.is_reprocess, input.reprocess_reason ?? null, input.timestamp]
      );
      await client.query('DELETE FROM po_in_progress WHERE op_id = $1 AND stage = $2', [input.po_id, boxNumber]);
      await productionOrderRepository.updateStatus(input.po_id, nextStatus, boxNumber, client);
      await activityLogRepository.log({ op_id: input.po_id, stage: boxNumber, action: 'completed', user_id: userId, details: input.has_adjustment ? `Ajuste: ${input.adjustment_details}` : undefined }, client);
    });
  },

  async revert(poId: string, boxNumber: BoxNumber, userId: string) {
    const prevStatus = boxNumber === 'box4' ? 'preparacao' : boxNumber === 'box5' ? 'box4' : 'box5';
    await db.transaction(async (client) => {
      await client.query('DELETE FROM po_box_processing WHERE op_id = $1 AND box_number = $2', [poId, boxNumber]);
      await client.query('DELETE FROM po_in_progress WHERE op_id = $1 AND stage = $2', [poId, boxNumber]);
      await productionOrderRepository.updateStatus(poId, prevStatus, prevStatus, client);
      await activityLogRepository.log({ op_id: poId, stage: boxNumber, action: 'reverted', user_id: userId }, client);
    });
  },
};
