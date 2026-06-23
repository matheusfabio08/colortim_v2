import { PoolClient } from 'pg';
import { db } from '../config/database';
import { ProductionSheet } from '../models/types';

export const productionSheetRepository = {
  async create(data: Partial<ProductionSheet>, client: PoolClient): Promise<ProductionSheet> {
    const { rows } = await client.query<ProductionSheet>(
      `INSERT INTO production_sheets (sheet_number,client,color,order_number,description,entry_date,expected_date,created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [data.sheet_number,data.client,data.color,data.order_number??null,data.description??null,data.entry_date,data.expected_date,data.created_by??null]
    );
    return rows[0];
  },

  async findBySheetNumber(sheetNumber: string): Promise<ProductionSheet | null> {
    const { rows } = await db.query<ProductionSheet>('SELECT * FROM production_sheets WHERE sheet_number=$1', [sheetNumber]);
    return rows[0] ?? null;
  },

  async update(id: string, data: Partial<ProductionSheet>, client: PoolClient): Promise<void> {
    await client.query(
      `UPDATE production_sheets SET client=$1,color=$2,order_number=$3,description=$4,entry_date=$5,expected_date=$6 WHERE id=$7`,
      [data.client,data.color,data.order_number??null,data.description??null,data.entry_date,data.expected_date,id]
    );
  },

  async delete(id: string, client: PoolClient): Promise<void> {
    await client.query('DELETE FROM production_sheets WHERE id=$1', [id]);
  },

  async getLastSheetNumber(client: PoolClient): Promise<string | null> {
    const { rows } = await client.query(`SELECT sheet_number FROM production_sheets ORDER BY created_at DESC LIMIT 1`);
    return rows[0]?.sheet_number ?? null;
  },
};
