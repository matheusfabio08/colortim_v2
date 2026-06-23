import { db } from '../config/database';
import { activityLogRepository } from '../repositories/activityLog.repository';
import { productionOrderRepository } from '../repositories/productionOrder.repository';
import { NotFoundError } from '../utils/AppError';
import { generateInspectionNumber } from '../utils/opNumberGenerator';
import { z } from 'zod';
import { FabricQualityInspectionSchema } from '../validators/schemas';

export const fabricQualityService = {
  async getAll(status?: string) {
    const params: any[] = [];
    let where = '1=1';
    if (status) { where = 'status = $1'; params.push(status); }
    const { rows } = await db.query(`SELECT * FROM fabric_quality_inspections WHERE ${where} ORDER BY created_at DESC`, params);
    return rows;
  },

  async getById(id: string) {
    const { rows } = await db.query('SELECT * FROM fabric_quality_inspections WHERE id = $1', [id]);
    if (!rows[0]) throw new NotFoundError('Inspeção');
    return rows[0];
  },

  async create(input: z.infer<typeof FabricQualityInspectionSchema>) {
    const inspectionNumber = await generateInspectionNumber();
    const { rows } = await db.query(
      `INSERT INTO fabric_quality_inspections
        (inspection_number, item_description, weight, destination_sector, observations, defect_image_url, employee_name, inspection_date, priority, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [inspectionNumber, input.item_description, input.weight, input.destination_sector,
       input.observations ?? null, input.defect_image_url ?? null, input.employee_name,
       input.inspection_date, input.priority ?? 'normal', input.status ?? 'pending']
    );
    return rows[0];
  },

  async update(id: string, input: Partial<z.infer<typeof FabricQualityInspectionSchema>>) {
    const existing = await this.getById(id);
    const fields: string[] = [];
    const vals: any[] = [];
    let i = 1;
    const allowed = ['item_description','weight','destination_sector','observations','defect_image_url','employee_name','inspection_date','priority','status'];
    for (const key of allowed) {
      if ((input as any)[key] !== undefined) { fields.push(`${key} = $${i++}`); vals.push((input as any)[key]); }
    }
    if (fields.length === 0) return existing;
    vals.push(id);
    const { rows } = await db.query(`UPDATE fabric_quality_inspections SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`, vals);
    return rows[0];
  },

  async delete(id: string) {
    const { rowCount } = await db.query('DELETE FROM fabric_quality_inspections WHERE id = $1', [id]);
    if (!rowCount) throw new NotFoundError('Inspeção');
  },

  async completeQualityMalhas(poId: string, userId: string) {
    const op = await productionOrderRepository.findById(poId);
    if (!op) throw new NotFoundError('Ordem de produção');
    await db.transaction(async (client) => {
      await productionOrderRepository.updateStatus(poId, 'preparacao', 'qualidade_malhas', client);
      await activityLogRepository.log({ op_id: poId, stage: 'qualidade_malhas', action: 'completed', user_id: userId }, client);
    });
  },
};
