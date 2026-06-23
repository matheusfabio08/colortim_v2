import { db } from '../config/database';
import { activityLogRepository } from '../repositories/activityLog.repository';
import { productionOrderRepository } from '../repositories/productionOrder.repository';
import { NotFoundError, BadRequestError } from '../utils/AppError';
import { z } from 'zod';
import { PreparationSchema, BatchPreparationSchema, CreateLotsSchema } from '../validators/schemas';

function destinationToStatus(dest: string): string {
  if (dest === 'Box 4') return 'box4';
  if (dest === 'Box 5') return 'box5';
  if (dest === 'Box 6') return 'box6';
  return 'producao';
}

function nextBatchNum(last: string | null): string {
  if (!last) return 'LOTE-001';
  const num = parseInt(last.split('-')[1], 10);
  return isNaN(num) ? 'LOTE-001' : `LOTE-${String(num+1).padStart(3,'0')}`;
}

export const preparationService = {
  async complete(input: z.infer<typeof PreparationSchema>, userId: string): Promise<void> {
    const nextStatus = destinationToStatus(input.destination_box);
    await db.transaction(async (client) => {
      await client.query(`INSERT INTO po_preparation (op_id,employee_ids,start_time,end_time,splices,total_weight,destination_box) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [input.po_id, JSON.stringify(input.employee_meters), input.start_time, input.end_time, JSON.stringify(input.splices), input.total_weight, input.destination_box]);
      await productionOrderRepository.updateStatus(input.po_id, nextStatus, 'preparacao', client);
      await activityLogRepository.log({ op_id: input.po_id, stage: 'preparacao', action: 'completed', user_id: userId }, client);
    });
  },
  async completeBatch(input: z.infer<typeof BatchPreparationSchema>, userId: string): Promise<{ batch_number: string }> {
    return db.transaction(async (client) => {
      const { rows } = await client.query(`SELECT batch_number FROM preparation_batches ORDER BY created_at DESC LIMIT 1`);
      const batchNumber = nextBatchNum(rows[0]?.batch_number ?? null);
      const { rows: br } = await client.query(
        `INSERT INTO preparation_batches (batch_number,color,total_weight,destination_box,employee_ids,splices,start_time,end_time) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
        [batchNumber,input.color,input.total_weight,input.destination_box,JSON.stringify(input.employee_meters),JSON.stringify(input.splices),input.start_time,input.end_time]
      );
      const batchId = br[0].id;
      const nextStatus = destinationToStatus(input.destination_box);
      for (const op of input.ops) {
        await client.query(`INSERT INTO batch_ops (batch_id,op_id,meters_in_batch) VALUES ($1,$2,$3)`, [batchId,op.op_id,op.meters]);
        await client.query(`INSERT INTO po_preparation (op_id,employee_ids,start_time,end_time,splices,total_weight,destination_box) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [op.op_id,JSON.stringify(input.employee_meters),input.start_time,input.end_time,JSON.stringify(input.splices),op.meters,input.destination_box]);
        await productionOrderRepository.updateStatus(op.op_id, nextStatus, 'preparacao', client);
        await activityLogRepository.log({ op_id: op.op_id, stage: 'preparacao', action: 'completed_in_batch', user_id: userId, details: `Lote ${batchNumber}` }, client);
      }
      return { batch_number: batchNumber };
    });
  },
  async createLots(input: z.infer<typeof CreateLotsSchema>, userId: string): Promise<any> {
    if (input.lot_meters.length !== input.num_lots) throw new BadRequestError('Par\u00e2metros inv\u00e1lidos');
    const parent = await productionOrderRepository.findById(input.parent_op_id);
    if (!parent) throw new NotFoundError('OP pai');
    return db.transaction(async (client) => {
      const created: any[] = [];
      for (let i = 0; i < input.num_lots; i++) {
        const lotNumber = i + 1;
        const meters = input.lot_meters[i];
        const opNumber = `${parent.op_number}-L${lotNumber}`;
        const { rows } = await client.query(
          `INSERT INTO production_orders (sheet_id,op_number,client,color,order_number,entry_date,expected_date,material,quantity,unit,requires_lab,status,current_stage,responsible_user_id,description,lot_number,parent_op_id,lot_meters) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING id`,
          [parent.sheet_id,opNumber,parent.client,parent.color,parent.order_number,parent.entry_date,parent.expected_date,parent.material,meters,parent.unit,parent.requires_lab,'preparacao','preparacao',userId,parent.description,lotNumber,parent.id,meters]
        );
        await activityLogRepository.log({ op_id: rows[0].id, stage: 'preparacao', action: 'lot_created', user_id: userId, details: `Lote ${lotNumber} de ${input.num_lots}` }, client);
        created.push({ id: rows[0].id, op_number: opNumber, lot_number: lotNumber });
      }
      await client.query(`UPDATE production_orders SET status='concluido',is_completed=TRUE WHERE id=$1`, [input.parent_op_id]);
      await activityLogRepository.log({ op_id: input.parent_op_id, stage: 'preparacao', action: 'split_into_lots', user_id: userId, details: `Dividida em ${input.num_lots} lotes` }, client);
      return { success: true, lots: created };
    });
  },
};
