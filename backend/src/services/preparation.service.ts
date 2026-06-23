import { db } from '../config/database';
import { productionOrderRepository } from '../repositories/productionOrder.repository';
import { activityLogRepository } from '../repositories/activityLog.repository';
import { generateBatchNumber } from '../utils/opNumberGenerator';
import { NotFoundError, BadRequestError } from '../utils/AppError';
import { z } from 'zod';
import { PreparationSchema, BatchPreparationSchema, CreateLotsSchema } from '../validators/schemas';

export const preparationService = {
  async complete(input: z.infer<typeof PreparationSchema>, userId: string) {
    const op = await productionOrderRepository.findById(input.po_id);
    if (!op) throw new NotFoundError('Ordem de produção');
    await db.transaction(async (client) => {
      await client.query(
        `INSERT INTO po_preparation (op_id, employee_id, machine_id, notes, processed_at)
         VALUES ($1,$2,$3,$4,$5)`,
        [input.po_id, input.employee_id, input.machine_id ?? null, input.notes ?? null, input.timestamp]
      );
      await productionOrderRepository.updateStatus(input.po_id, 'producao', 'preparacao', client);
      await activityLogRepository.log({ op_id: input.po_id, stage: 'preparacao', action: 'completed', user_id: userId }, client);
    });
  },

  async completeBatch(input: z.infer<typeof BatchPreparationSchema>, userId: string) {
    const results = [];
    for (const opId of input.op_ids) {
      await db.transaction(async (client) => {
        await client.query(
          `INSERT INTO po_preparation (op_id, employee_id, notes, processed_at)
           VALUES ($1,$2,$3,$4)
           ON CONFLICT (op_id) DO NOTHING`,
          [opId, input.employee_id, input.notes ?? null, input.timestamp]
        );
        await productionOrderRepository.updateStatus(opId, 'producao', 'preparacao', client);
        await activityLogRepository.log({ op_id: opId, stage: 'preparacao', action: 'batch_completed', user_id: userId }, client);
      });
      results.push({ op_id: opId, success: true });
    }
    return results;
  },

  async getAvailableForBatch(color?: string) {
    const conditions = [`po.status = 'preparacao'`, 'po.lot_number IS NULL'];
    const params: any[] = [];
    if (color) { conditions.push(`po.color ILIKE $1`); params.push(`%${color}%`); }
    const { rows } = await db.query(
      `SELECT po.*, ps.sheet_number FROM production_orders po
       JOIN production_sheets ps ON po.sheet_id = ps.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY po.priority DESC, po.expected_date ASC`,
      params
    );
    return rows;
  },

  async createLots(input: z.infer<typeof CreateLotsSchema>, userId: string, username: string) {
    const parent = await productionOrderRepository.findById(input.po_id);
    if (!parent) throw new NotFoundError('Ordem de produção');
    if (parent.lot_number !== null) throw new BadRequestError('OP já possui lotes criados');

    return db.transaction(async (client) => {
      const lots = [];
      for (let i = 1; i <= input.num_lots; i++) {
        const lotOpNumber = `${parent.op_number}-L${i}`;
        const { rows } = await client.query(
          `INSERT INTO production_orders
            (sheet_id, op_number, client, color, order_number, entry_date, expected_date,
             material, quantity, unit, requires_lab, requires_fabric_quality,
             region_jaragua, region_brusque, region_gaspar,
             fiber_id, is_dual_fiber, fiber2_id,
             status, current_stage, priority,
             lot_number, parent_op_id, responsible_user_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)
           RETURNING *`,
          [
            parent.sheet_id, lotOpNumber, parent.client, parent.color,
            parent.order_number ?? null, parent.entry_date, parent.expected_date,
            parent.material, parent.quantity, parent.unit,
            parent.requires_lab, parent.requires_fabric_quality,
            parent.region_jaragua, parent.region_brusque, parent.region_gaspar,
            parent.fiber_id ?? null, parent.is_dual_fiber, parent.fiber2_id ?? null,
            'preparacao', 'preparacao', parent.priority,
            i, parent.id, parent.responsible_user_id ?? null,
          ]
        );
        await activityLogRepository.log({ op_id: rows[0].id, stage: 'criacao', action: 'lot_created', user_id: userId }, client);
        lots.push(rows[0]);
      }
      await client.query(
        `UPDATE production_orders SET status = 'concluido', is_completed = TRUE WHERE id = $1`,
        [parent.id]
      );
      return lots;
    });
  },
};
