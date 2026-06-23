import { db } from '../config/database';
import { PoolClient } from 'pg';

export interface LogEntry {
  op_id: string;
  stage: string;
  action: string;
  user_id?: string;
  details?: string;
}

export const activityLogRepository = {
  async log(entry: LogEntry, client?: PoolClient): Promise<void> {
    const q = client ?? db;
    await q.query(
      `INSERT INTO activity_log (op_id, stage, action, user_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [entry.op_id, entry.stage, entry.action, entry.user_id ?? null, entry.details ?? null]
    );
  },

  async findByOpId(opId: string) {
    const { rows } = await db.query(
      `SELECT al.*, u.name AS user_name
       FROM activity_log al
       LEFT JOIN users u ON al.user_id = u.id
       WHERE al.op_id = $1
       ORDER BY al.created_at DESC`,
      [opId]
    );
    return rows;
  },

  async findRecent(limit: number = 50) {
    const { rows } = await db.query(
      `SELECT al.*, po.op_number, po.client, po.color, u.name AS user_name
       FROM activity_log al
       JOIN production_orders po ON al.op_id = po.id
       LEFT JOIN users u ON al.user_id = u.id
       ORDER BY al.created_at DESC
       LIMIT $1`,
      [limit]
    );
    return rows;
  },
};
