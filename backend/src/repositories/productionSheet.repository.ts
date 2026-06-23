import { db } from '../config/database';
import { PoolClient } from 'pg';
import { ProductionSheet } from '../models/types';

export const productionSheetRepository = {
  async create(data: {
    sheet_number: string;
    client: string;
    color: string;
    order_number?: string;
    description?: string;
    entry_date: string;
    expected_date: string;
    created_by?: string;
  }, client?: PoolClient): Promise<ProductionSheet> {
    const q = client ?? db;
    const { rows } = await q.query<ProductionSheet>(
      `INSERT INTO production_sheets
        (sheet_number, client, color, order_number, description, entry_date, expected_date, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [
        data.sheet_number, data.client, data.color,
        data.order_number ?? null, data.description ?? null,
        data.entry_date, data.expected_date,
        data.created_by ?? null,
      ]
    );
    return rows[0];
  },

  async findById(id: string): Promise<ProductionSheet | null> {
    const { rows } = await db.query<ProductionSheet>(
      'SELECT * FROM production_sheets WHERE id = $1', [id]
    );
    return rows[0] ?? null;
  },

  async findAll() {
    const { rows } = await db.query(
      `SELECT ps.*, COUNT(po.id)::int AS op_count
       FROM production_sheets ps
       LEFT JOIN production_orders po ON ps.id = po.sheet_id
       GROUP BY ps.id
       ORDER BY ps.created_at DESC`
    );
    return rows;
  },
};
