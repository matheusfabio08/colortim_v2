import { db } from '../config/database';
import { generateInspectionNumber } from '../utils/generators';
import { NotFoundError } from '../utils/AppError';
import { FabricQualityInspection } from '../models/types';

export const fabricQualityService = {
  async list(status?: string) {
    if (status) {
      const { rows } = await db.query<FabricQualityInspection>('SELECT * FROM fabric_quality_inspections WHERE status=$1 ORDER BY created_at DESC', [status]);
      return rows;
    }
    const { rows } = await db.query<FabricQualityInspection>('SELECT * FROM fabric_quality_inspections ORDER BY created_at DESC');
    return rows;
  },
  async create(data: Partial<FabricQualityInspection>) {
    const inspectionNumber = await generateInspectionNumber();
    const { rows } = await db.query<FabricQualityInspection>(
      `INSERT INTO fabric_quality_inspections (inspection_number,item_description,weight,destination_sector,observations,defect_image_url,employee_name,inspection_date,priority,status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [inspectionNumber,data.item_description,data.weight,data.destination_sector,data.observations??null,data.defect_image_url??null,data.employee_name,data.inspection_date,data.priority??'normal',data.status??'pending']
    );
    return rows[0];
  },
  async update(id: string, data: Partial<FabricQualityInspection>) {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;
    const allowed: (keyof FabricQualityInspection)[] = ['item_description','weight','destination_sector','observations','defect_image_url','employee_name','inspection_date','priority','status'];
    for (const key of allowed) {
      if (data[key] !== undefined) { fields.push(`${key}=$${idx++}`); values.push(data[key]); }
    }
    if (!fields.length) return;
    values.push(id);
    await db.query(`UPDATE fabric_quality_inspections SET ${fields.join(',')} WHERE id=$${idx}`, values);
  },
  async delete(id: string) {
    const { rowCount } = await db.query('DELETE FROM fabric_quality_inspections WHERE id=$1', [id]);
    if (!rowCount) throw new NotFoundError('Inspe\u00e7\u00e3o');
  },
};
