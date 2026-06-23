import { db } from '../config/database';
import { productionOrderRepository } from '../repositories/productionOrder.repository';
import { productionSheetRepository } from '../repositories/productionSheet.repository';
import { activityLogRepository } from '../repositories/activityLog.repository';
import { generateOpNumber, generateSheetNumber } from '../utils/opNumberGenerator';
import { addBusinessDays, todayISO } from '../utils/dateUtils';
import { NotFoundError, BadRequestError } from '../utils/AppError';
import { z } from 'zod';
import { CreateProductionOrderSchema } from '../validators/schemas';

export const productionOrderService = {
  async create(input: z.infer<typeof CreateProductionOrderSchema>, userId: string) {
    return db.transaction(async (client) => {
      const sheetNumber = await generateSheetNumber(client);
      const entryDate = input.entry_date ?? todayISO();
      const expectedDate = input.expected_date ?? todayISO();

      const sheet = await productionSheetRepository.create({
        sheet_number: sheetNumber,
        client: input.client,
        color: input.color,
        order_number: input.order_number,
        description: input.description,
        entry_date: entryDate,
        expected_date: expectedDate,
        created_by: userId,
      }, client);

      const orders = [];
      for (const item of input.items) {
        const opNumber = await generateOpNumber(client);
        const { rows } = await client.query(
          `INSERT INTO production_orders
            (sheet_id, op_number, client, color, order_number, entry_date, expected_date,
             material, quantity, unit, requires_lab, requires_fabric_quality,
             region_jaragua, region_brusque, region_gaspar,
             fiber_id, is_dual_fiber, fiber2_id, lot_meters,
             status, current_stage, priority, responsible_user_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)
           RETURNING *`,
          [
            sheet.id, opNumber, input.client, input.color, input.order_number ?? null,
            entryDate, expectedDate,
            item.material, item.quantity, item.unit, item.requires_lab,
            input.requires_fabric_quality,
            input.region_jaragua, input.region_brusque, input.region_gaspar,
            input.fiber_id ?? null, input.is_dual_fiber, input.fiber2_id ?? null,
            item.lot_meters ?? null,
            input.requires_fabric_quality ? 'qualidade_malhas' : 'almoxarifado',
            input.requires_fabric_quality ? 'qualidade_malhas' : 'almoxarifado',
            0, userId,
          ]
        );
        const op = rows[0];
        await activityLogRepository.log({ op_id: op.id, stage: 'criacao', action: 'created', user_id: userId }, client);
        orders.push(op);
      }

      return { sheet, orders, op_number: orders[0]?.op_number };
    });
  },

  async getAll(filters?: { status?: string; is_completed?: boolean; client?: string }) {
    return productionOrderRepository.findAll(filters);
  },

  async getById(id: string) {
    const op = await productionOrderRepository.findById(id);
    if (!op) throw new NotFoundError('Ordem de produção');
    return op;
  },

  async complete(id: string, userId: string) {
    const op = await productionOrderRepository.findById(id);
    if (!op) throw new NotFoundError('Ordem de produção');
    await db.transaction(async (client) => {
      await productionOrderRepository.markCompleted(id, client);
      await activityLogRepository.log({ op_id: id, stage: 'conclusao', action: 'completed', user_id: userId }, client);
    });
  },

  async reopen(id: string, userId: string) {
    const op = await productionOrderRepository.findById(id);
    if (!op) throw new NotFoundError('Ordem de produção');
    await db.transaction(async (client) => {
      await client.query(
        `UPDATE production_orders SET is_completed = FALSE, status = 'producao', current_stage = 'producao', updated_at = NOW() WHERE id = $1`,
        [id]
      );
      await activityLogRepository.log({ op_id: id, stage: 'conclusao', action: 'reopened', user_id: userId }, client);
    });
  },

  async getHistory(id: string) {
    const op = await productionOrderRepository.findById(id);
    if (!op) throw new NotFoundError('Ordem de produção');
    const logs = await activityLogRepository.findByOpId(id);
    return { op, logs };
  },
};
