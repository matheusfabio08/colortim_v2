import { db } from '../config/database';
import { productionOrderRepository } from '../repositories/productionOrder.repository';
import { activityLogRepository } from '../repositories/activityLog.repository';
import { NotFoundError } from '../utils/AppError';
import { z } from 'zod';
import { QualitySchema } from '../validators/schemas';

export const qualityService = {
  async complete(input: z.infer<typeof QualitySchema>, userId: string) {
    const op = await productionOrderRepository.findById(input.po_id);
    if (!op) throw new NotFoundError('Ordem de produção');
    await db.transaction(async (client) => {
      await client.query(
        `INSERT INTO po_quality (op_id, employee_id, approved, rejection_reason, notes, processed_at)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [input.po_id, input.employee_id, input.approved, input.rejection_reason ?? null, input.notes ?? null, input.timestamp]
      );
      const nextStatus = input.approved ? 'concluido' : 'producao';
      if (input.approved) {
        await productionOrderRepository.markCompleted(input.po_id, client);
      } else {
        await productionOrderRepository.updateStatus(input.po_id, 'producao', 'qualidade_reprovado', client);
      }
      await activityLogRepository.log({
        op_id: input.po_id, stage: 'qualidade', action: input.approved ? 'approved' : 'rejected',
        user_id: userId, details: input.rejection_reason,
      }, client);
    });
  },
};
