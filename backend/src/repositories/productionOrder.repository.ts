import { PoolClient } from 'pg';
import { db } from '../config/database';
import { ProductionOrder } from '../models/types';

export const productionOrderRepository = {
  async findAll(filters: { status?: string; search?: string; requires_lab?: boolean }): Promise<ProductionOrder[]> {
    const conditions: string[] = ['1=1'];
    const params: any[] = [];
    let idx = 1;
    if (filters.status) { conditions.push(`status = $${idx++}`); params.push(filters.status); }
    if (filters.requires_lab === true) { conditions.push('requires_lab = TRUE'); }
    if (filters.search) {
      conditions.push(`(op_number ILIKE $${idx} OR client ILIKE $${idx} OR color ILIKE $${idx})`);
      params.push(`%${filters.search}%`); idx++;
    }
    const { rows } = await db.query<ProductionOrder>(
      `SELECT * FROM production_orders WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC`, params
    );
    return rows;
  },

  async findById(id: string): Promise<ProductionOrder | null> {
    const { rows } = await db.query<ProductionOrder>('SELECT * FROM production_orders WHERE id = $1', [id]);
    return rows[0] ?? null;
  },

  async findBySheetId(sheetId: string): Promise<ProductionOrder[]> {
    const { rows } = await db.query<ProductionOrder>(
      'SELECT * FROM production_orders WHERE sheet_id = $1 ORDER BY op_number', [sheetId]
    );
    return rows;
  },

  async create(data: Partial<ProductionOrder>, client?: PoolClient): Promise<ProductionOrder> {
    const q = client ?? db;
    const { rows } = await q.query<ProductionOrder>(
      `INSERT INTO production_orders
        (sheet_id,op_number,client,color,order_number,entry_date,expected_date,material,quantity,unit,
         requires_lab,requires_fabric_quality,status,current_stage,responsible_user_id,description,
         region_jaragua,region_brusque,region_gaspar,fiber_id,is_dual_fiber,fiber2_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
       RETURNING *`,
      [data.sheet_id,data.op_number,data.client,data.color,data.order_number??null,
       data.entry_date,data.expected_date,data.material??null,data.quantity??null,data.unit??null,
       data.requires_lab??false,data.requires_fabric_quality??false,
       data.status??'almoxarifado',data.current_stage??'almoxarifado',
       data.responsible_user_id??null,data.description??null,
       data.region_jaragua??false,data.region_brusque??false,data.region_gaspar??false,
       data.fiber_id??null,data.is_dual_fiber??false,data.fiber2_id??null]
    );
    return rows[0];
  },

  async updateStatus(id: string, status: string, currentStage: string, client?: PoolClient): Promise<void> {
    const q = client ?? db;
    await q.query('UPDATE production_orders SET status=$1,current_stage=$2 WHERE id=$3', [status,currentStage,id]);
  },

  async markCompleted(id: string, client?: PoolClient): Promise<void> {
    const q = client ?? db;
    await q.query(`UPDATE production_orders SET status='concluido',current_stage='qualidade',is_completed=TRUE WHERE id=$1`, [id]);
  },

  async updatePriority(id: string, priority: number, priorityNotes?: string): Promise<void> {
    await db.query('UPDATE production_orders SET priority=$1,priority_notes=$2 WHERE id=$3', [priority,priorityNotes??null,id]);
  },

  async updateSequenceOrder(id: string, sequenceOrder: number): Promise<void> {
    await db.query('UPDATE production_orders SET sequence_order=$1 WHERE id=$2', [sequenceOrder,id]);
  },

  async deleteBySheetId(sheetId: string, client: PoolClient): Promise<string[]> {
    const { rows } = await client.query<{ id: string }>('SELECT id FROM production_orders WHERE sheet_id=$1', [sheetId]);
    const ids = rows.map(r => r.id);
    if (ids.length > 0) await client.query('DELETE FROM production_orders WHERE sheet_id=$1', [sheetId]);
    return ids;
  },

  async getLastOpNumber(client?: PoolClient): Promise<string | null> {
    const q = client ?? db;
    const { rows } = await q.query(`SELECT op_number FROM production_orders WHERE lot_number IS NULL ORDER BY created_at DESC,id DESC LIMIT 1`);
    return rows[0]?.op_number ?? null;
  },

  async findOverdue(today: string): Promise<ProductionOrder[]> {
    const { rows } = await db.query<ProductionOrder>(
      `SELECT * FROM production_orders WHERE is_completed=FALSE AND expected_date<$1 ORDER BY expected_date ASC`, [today]
    );
    return rows;
  },

  async countByStatus(): Promise<Record<string, number>> {
    const { rows } = await db.query(
      `SELECT status,COUNT(*) as count FROM production_orders WHERE is_completed=FALSE GROUP BY status`
    );
    const result: Record<string, number> = {};
    rows.forEach((r: any) => { result[r.status] = parseInt(r.count); });
    return result;
  },
};
