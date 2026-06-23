import { db } from '../config/database';
import { activityLogRepository } from '../repositories/activityLog.repository';
import { NotFoundError } from '../utils/AppError';
import { z } from 'zod';
import { LaboratorySchema } from '../validators/schemas';

export const laboratoryService = {
  async complete(input: z.infer<typeof LaboratorySchema>, userId: string): Promise<void> {
    await db.transaction(async (client) => {
      await client.query(`INSERT INTO po_laboratory (op_id,num_batches,is_recipe_ready,recipe_origin_date,description,is_approved,start_time,end_time) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [input.po_id,input.num_batches??null,input.is_recipe_ready,input.recipe_origin_date??null,input.description??null,input.is_approved,input.start_time,input.end_time]);
      await activityLogRepository.log({ op_id: input.po_id, stage: 'laboratorio', action: input.is_approved ? 'approved' : 'processed', user_id: userId }, client);
    });
  },
  async getRecords() {
    const { rows } = await db.query(`SELECT po.*,lab.id as lab_record_id,lab.num_batches,lab.is_recipe_ready,lab.recipe_origin_date,lab.description as lab_description,lab.is_approved,lab.start_time as lab_start_time,lab.end_time as lab_end_time,lab.created_at as lab_processed_at FROM production_orders po LEFT JOIN po_laboratory lab ON po.id=lab.op_id WHERE po.requires_lab=TRUE AND po.lot_number IS NULL AND po.parent_op_id IS NULL ORDER BY po.created_at DESC`);
    return rows;
  },
  async deleteRecord(labRecordId: string): Promise<void> {
    const { rowCount } = await db.query('DELETE FROM po_laboratory WHERE id=$1', [labRecordId]);
    if (!rowCount) throw new NotFoundError('Registro de laborat\u00f3rio');
  },
};
