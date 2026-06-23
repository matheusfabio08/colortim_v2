import { db } from '../config/database';
import { PoolClient } from 'pg';

function nextNum(last: string | null, prefix: string, sep = '-'): string {
  if (!last) return `${prefix}${sep}001`;
  const parts = last.split(sep);
  const num = parseInt(parts[parts.length - 1], 10);
  return isNaN(num) ? `${prefix}${sep}001` : `${prefix}${sep}${String(num + 1).padStart(3, '0')}`;
}

export async function generateOpNumber(client?: PoolClient): Promise<string> {
  const q = client ?? db;
  const { rows } = await q.query(
    `SELECT op_number FROM production_orders WHERE lot_number IS NULL ORDER BY created_at DESC LIMIT 1`
  );
  if (!rows[0]) return '001';
  const base = (rows[0].op_number as string).split('-L')[0];
  const num = parseInt(base, 10);
  return isNaN(num) ? '001' : String(num + 1).padStart(3, '0');
}

export async function generateSheetNumber(client?: PoolClient): Promise<string> {
  const q = client ?? db;
  const { rows } = await q.query(
    `SELECT sheet_number FROM production_sheets ORDER BY created_at DESC LIMIT 1`
  );
  return nextNum(rows[0]?.sheet_number ?? null, 'SHEET');
}

export async function generateBatchNumber(client?: PoolClient): Promise<string> {
  const q = client ?? db;
  const { rows } = await q.query(
    `SELECT batch_number FROM preparation_batches ORDER BY created_at DESC LIMIT 1`
  );
  return nextNum(rows[0]?.batch_number ?? null, 'LOTE');
}

export async function generateInspectionNumber(client?: PoolClient): Promise<string> {
  const q = client ?? db;
  const { rows } = await q.query(
    `SELECT inspection_number FROM fabric_quality_inspections ORDER BY created_at DESC LIMIT 1`
  );
  return nextNum(rows[0]?.inspection_number ?? null, 'INS');
}
