import { db } from '../config/database';
import { PoolClient } from 'pg';
import { ProductionOrder, POStatus } from '../models/types';

export const productionOrderRepository = {
  async findById(id: string): Promise<ProductionOrder | null> {
    const { rows } = await db.query<ProductionOrder>(
      `SELECT po.*, ps.sheet_number, f.name AS fiber_name, f2.name AS fiber2_name
       FROM production_orders po
       JOIN production_sheets ps ON po.sheet_id = ps.id
       LEFT JOIN fibras f  ON po.fiber_id  = f.id
       LEFT JOIN fibras f2 ON po.fiber2_id = f2.id
       WHERE po.id = $1`,
      [id]
    );
    return rows[0] ?? null;
  },

  async findByOpNumber(opNumber: string): Promise<ProductionOrder | null> {
    const { rows } = await db.query<ProductionOrder>(
      'SELECT * FROM production_orders WHERE op_number = $1', [opNumber]
    );
    return rows[0] ?? null;
  },

  async findAll(filters?: {
    status?: string;
    is_completed?: boolean;
    client?: string;
  }) {
    const conditions = ['1=1'];
    const params: any[] = [];
    let idx = 1;

    if (filters?.status) {
      conditions.push(`po.status = $${idx++}`);
      params.push(filters.status);
    }
    if (filters?.is_completed !== undefined) {
      conditions.push(`po.is_completed = $${idx++}`);
      params.push(filters.is_completed);
    }
    if (filters?.client) {
      conditions.push(`po.client ILIKE $${idx++}`);
      params.push(`%${filters.client}%`);
    }

    const { rows } = await db.query(
      `SELECT po.*, ps.sheet_number, f.name AS fiber_name, f2.name AS fiber2_name
       FROM production_orders po
       JOIN production_sheets ps ON po.sheet_id = ps.id
       LEFT JOIN fibras f  ON po.fiber_id  = f.id
       LEFT JOIN fibras f2 ON po.fiber2_id = f2.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY po.priority DESC, po.sequence_order ASC NULLS LAST, po.expected_date ASC`,
      params
    );
    return rows;
  },

  async updateStatus(
    id: string,
    status: string,
    currentStage: string,
    client?: PoolClient
  ): Promise<void> {
    const q = client ?? db;
    await q.query(
      `UPDATE production_orders
       SET status = $1, current_stage = $2, updated_at = NOW()
       WHERE id = $3`,
      [status, currentStage, id]
    );
  },

  async markCompleted(id: string, client?: PoolClient): Promise<void> {
    const q = client ?? db;
    await q.query(
      `UPDATE production_orders
       SET is_completed = TRUE, status = 'concluido', current_stage = 'concluido', updated_at = NOW()
       WHERE id = $1`,
      [id]
    );
  },

  async updatePriority(id: string, priority: number, priorityNotes?: string): Promise<void> {
    await db.query(
      `UPDATE production_orders SET priority = $1, priority_notes = $2, updated_at = NOW() WHERE id = $3`,
      [priority, priorityNotes ?? null, id]
    );
  },

  async updateSequenceOrder(id: string, sequenceOrder: number): Promise<void> {
    await db.query(
      `UPDATE production_orders SET sequence_order = $1, updated_at = NOW() WHERE id = $2`,
      [sequenceOrder, id]
    );
  },

  async getBoxRecords(boxNumber: string) {
    const { rows } = await db.query(
      `SELECT po.*, ps.sheet_number,
              bp.employee_id, bp.has_adjustment, bp.adjustment_details,
              bp.is_reprocess, bp.reprocess_reason, bp.processed_at
       FROM production_orders po
       JOIN production_sheets ps ON po.sheet_id = ps.id
       LEFT JOIN po_box_processing bp ON po.id = bp.op_id AND bp.box_number = $1
       WHERE po.status = $1 OR po.status = $2
       ORDER BY po.sequence_order ASC NULLS LAST, po.expected_date ASC`,
      [boxNumber, `${boxNumber}_done`]
    );
    return rows;
  },
};
