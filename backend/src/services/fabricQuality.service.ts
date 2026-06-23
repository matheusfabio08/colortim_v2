import { db } from '../config/database';
import { generateInspectionNumber } from '../utils/opNumberGenerator';
import { NotFoundError } from '../utils/AppError';
import { z } from 'zod';
import { FabricQualityInspectionSchema } from '../validators/schemas';

export const fabricQualityService = {
  async getAll() {
    const { rows } = await db.query('SELECT * FROM fabric_quality_inspections ORDER BY inspection_date DESC, created_at DESC');
    return rows;
  },

  async create(input: z.infer<typeof FabricQualityInspectionSchema>) {
    const inspection_number = await generateInspectionNumber();
    const { rows } = await db.query(
      `INSERT INTO fabric_quality_inspections (inspection_number,item_description,weight,destination_sector,observations,defect_image_url,employee_name,inspection_date,priority,status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [inspection_number,input.item_description,input.weight,input.destination_sector,input.observations??null,input.defect_image_url??null,input.employee_name,input.inspection_date,input.priority??'normal',input.status??'pending']
    );
    return rows[0];
  },

  async update(id: string, data: Partial<z.infer<typeof FabricQualityInspectionSchema>>) {
    const fields: string[] = []; const values: any[] = []; let idx = 1;
    const keys = ['item_description','weight','destination_sector','observations','defect_image_url','employee_name','inspection_date','priority','status'] as const;
    for (const key of keys) {
      if (data[key] !== undefined) { fields.push(`${key}=$${idx++}`); values.push(data[key]); }
    }
    if (!fields.length) return;
    values.push(id);
    await db.query(`UPDATE fabric_quality_inspections SET ${fields.join(',')} WHERE id=$${idx}`, values);
  },

  async delete(id: string): Promise<void> {
    const { rowCount } = await db.query('DELETE FROM fabric_quality_inspections WHERE id=$1', [id]);
    if (!rowCount) throw new NotFoundError('Inspeção de qualidade');
  },
};
