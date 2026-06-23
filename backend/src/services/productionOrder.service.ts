import { PoolClient } from 'pg';
import { db } from '../config/database';
import { productionOrderRepository } from '../repositories/productionOrder.repository';
import { productionSheetRepository } from '../repositories/productionSheet.repository';
import { activityLogRepository } from '../repositories/activityLog.repository';
import { addBusinessDays } from '../utils/dateUtils';
import { NotFoundError } from '../utils/AppError';
import { z } from 'zod';
import { CreatePOSchema } from '../validators/schemas';

type CreatePOInput = z.infer<typeof CreatePOSchema>;

function nextSeqNum(last: string | null): number {
  if (!last) return 1;
  const num = parseInt(last.split('-L')[0], 10);
  return isNaN(num) ? 1 : num + 1;
}

function nextSheetNum(last: string | null): string {
  if (!last) return 'SHEET-001';
  const num = parseInt(last.split('-')[1], 10);
  return isNaN(num) ? 'SHEET-001' : `SHEET-${String(num+1).padStart(3,'0')}`;
}

export const productionOrderService = {
  async list(filters: { status?: string; search?: string; requires_lab?: string }) {
    return productionOrderRepository.findAll({ status: filters.status, search: filters.search, requires_lab: filters.requires_lab === 'true' });
  },
  async getById(id: string) {
    const op = await productionOrderRepository.findById(id);
    if (!op) throw new NotFoundError('Ordem de produ\u00e7\u00e3o');
    const items = await productionOrderRepository.findBySheetId(op.sheet_id);
    const history = await activityLogRepository.findByOpId(id);
    return { ...op, items: items.map(i => ({ id: i.id, material: i.material, quantity: i.quantity, unit: i.unit, individual_op: i.op_number, requires_lab: i.requires_lab })), history };
  },
  async getBySheetNumber(sheetNumber: string) {
    const sheet = await productionSheetRepository.findBySheetNumber(sheetNumber);
    if (!sheet) throw new NotFoundError('Ficha de produ\u00e7\u00e3o');
    const ops = await productionOrderRepository.findBySheetId(sheet.id);
    return { ...sheet, op_number: sheet.sheet_number, items: ops.map(o => ({ material: o.material, quantity: o.quantity, unit: o.unit, individual_op: o.op_number })) };
  },
  async getNextOpNumber(): Promise<string> {
    const last = await productionOrderRepository.getLastOpNumber();
    return String(nextSeqNum(last)).padStart(3,'0');
  },
  async create(input: CreatePOInput, userId: string, userName: string) {
    return db.transaction(async (client: PoolClient) => {
      const lastSheet = await productionSheetRepository.getLastSheetNumber(client);
      const sheetNumber = nextSheetNum(lastSheet);
      const entryDate = input.entry_date ? new Date(input.entry_date) : new Date();
      const expectedDate = input.expected_date ? new Date(input.expected_date) : addBusinessDays(entryDate, 5);
      const sheet = await productionSheetRepository.create({ sheet_number: sheetNumber, client: input.client, color: input.color, order_number: input.order_number, description: input.description, entry_date: entryDate as any, expected_date: expectedDate as any, created_by: userId }, client);
      const lastOP = await productionOrderRepository.getLastOpNumber(client);
      let currentNum = nextSeqNum(lastOP);
      const created: Array<{ id: string; op_number: string }> = [];
      for (let i = 0; i < input.items.length; i++) {
        const item = input.items[i];
        const opNumber = String(currentNum + i).padStart(3,'0');
        const initStatus = item.requires_fabric_quality ? 'qualidade_malhas' : 'preparacao';
        const op = await productionOrderRepository.create({ sheet_id: sheet.id, op_number: opNumber, client: input.client, color: input.color, order_number: input.order_number, entry_date: entryDate as any, expected_date: expectedDate as any, material: item.material, quantity: item.quantity, unit: item.unit, requires_lab: item.requires_lab??false, requires_fabric_quality: item.requires_fabric_quality??false, status: initStatus as any, current_stage: 'almoxarifado', responsible_user_id: userId, description: input.description, region_jaragua: input.region_jaragua??false, region_brusque: input.region_brusque??false, region_gaspar: input.region_gaspar??false, fiber_id: input.fiber_id??undefined, is_dual_fiber: input.is_dual_fiber??false, fiber2_id: input.fiber2_id??undefined }, client);
        await activityLogRepository.log({ op_id: op.id, stage: 'almoxarifado', action: 'created', user_id: userId, details: `Criado por ${userName}` }, client);
        created.push({ id: op.id, op_number: op.op_number });
      }
      return { op_number: created[0].op_number, id: created[0].id, sheet_id: sheet.id };
    });
  },
  async delete(id: string): Promise<void> {
    const op = await productionOrderRepository.findById(id);
    if (!op) throw new NotFoundError('Ordem de produ\u00e7\u00e3o');
    await db.transaction(async (client: PoolClient) => {
      await productionOrderRepository.deleteBySheetId(op.sheet_id, client);
      await client.query('DELETE FROM production_sheets WHERE id=$1', [op.sheet_id]);
    });
  },
};
