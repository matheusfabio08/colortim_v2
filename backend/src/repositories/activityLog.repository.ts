import { PoolClient } from 'pg';
import { db } from '../config/database';
import { ActivityLog } from '../models/types';

export const activityLogRepository = {
  async log(data: { op_id: string; stage: string; action: string; user_id?: string; details?: string }, client?: PoolClient): Promise<void> {
    const q = client ?? db;
    await q.query(
      `INSERT INTO activity_log (op_id,stage,action,user_id,details) VALUES ($1,$2,$3,$4,$5)`,
      [data.op_id,data.stage,data.action,data.user_id??null,data.details??null]
    );
  },

  async findByOpId(opId: string): Promise<ActivityLog[]> {
    const { rows } = await db.query<ActivityLog>('SELECT * FROM activity_log WHERE op_id=$1 ORDER BY created_at ASC', [opId]);
    return rows;
  },
};
