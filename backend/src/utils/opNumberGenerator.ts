import { db } from '../config/database';

export async function generateOpNumber(client?: any): Promise<string> {
  const q = client ?? db;
  const result = await q.query(
    `SELECT op_number FROM production_orders ORDER BY created_at DESC, id DESC LIMIT 1`
  );
  if (result.rows.length === 0) return '001';
  const last = result.rows[0].op_number as string;
  const baseNumber = last.split('-L')[0];
  const num = parseInt(baseNumber, 10);
  if (isNaN(num)) return '001';
  return String(num + 1).padStart(3, '0');
}

export async function generateSheetNumber(client?: any): Promise<string> {
  const q = client ?? db;
  const result = await q.query(
    `SELECT sheet_number FROM production_sheets ORDER BY created_at DESC LIMIT 1`
  );
  if (result.rows.length === 0) return 'SHEET-001';
  const last = result.rows[0].sheet_number as string;
  const num = parseInt(last.split('-')[1], 10);
  if (isNaN(num)) return 'SHEET-001';
  return `SHEET-${String(num + 1).padStart(3, '0')}`;
}
