import { db } from '../config/database';
import { activityLogRepository } from '../repositories/activityLog.repository';
import { NotFoundError } from '../utils/AppError';
import { z } from 'zod';
import { PesagemSchema } from '../validators/schemas';

export const pesagemService = {
  async upsert(input: z.infer<typeof PesagemSchema>, userId: string): Promise<void> {
    await db.transaction(async (client) => {
      await client.query(`INSERT INTO po_pesagem (op_id,employee_id,notes,start_time,end_time) VALUES ($1,$2,$3,$4,$5)
        ON CONFLICT (op_id) DO UPDATE SET employee_id=$2,notes=$3,start_time=$4,end_time=$5`,
        [input.po_id,input.employee_id??null,input.notes??null,input.start_time??null,input.end_time??null]);
      await activityLogRepository.log({ op_id: input.po_id, stage: 'pesagem', action: 'updated', user_id: userId }, client);
    });
  },
  async getByOpId(opId: string) {
    const { rows } = await db.query('SELECT * FROM po_pesagem WHERE op_id=$1', [opId]);
    return rows[0] ?? null;
  },
};
