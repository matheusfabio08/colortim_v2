import { Router, Response } from 'express';
import { addBusinessDays } from 'date-fns';
import pool from '../db/pool';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { CreatePORequestSchema } from '../shared/types';

const router = Router();
router.use(authMiddleware);

// GET next OP number
router.get('/next-op-number', async (_req: AuthRequest, res: Response): Promise<void> => {
  const result = await pool.query('SELECT op_number FROM production_orders ORDER BY id DESC LIMIT 1');
  let nextOPNumber = '001';
  if (result.rows.length > 0) {
    const lastNum = parseInt(result.rows[0].op_number);
    if (!isNaN(lastNum)) nextOPNumber = String(lastNum + 1).padStart(3, '0');
  }
  res.json({ next_op_number: nextOPNumber });
});

// GET all production orders
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { status, search, requires_lab } = req.query;
  let query = 'SELECT * FROM production_orders WHERE 1=1';
  const params: any[] = [];
  let idx = 1;

  if (status) { query += ` AND status = $${idx++}`; params.push(status); }
  if (requires_lab === 'true') { query += ` AND requires_lab = true`; }
  if (search) {
    query += ` AND (op_number ILIKE $${idx} OR client ILIKE $${idx} OR color ILIKE $${idx})`;
    params.push(`%${search}%`); idx++;
  }
  query += ' ORDER BY created_at DESC';

  const result = await pool.query(query, params);
  res.json(result.rows);
});

// GET single OP
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const opRes = await pool.query('SELECT * FROM production_orders WHERE id = $1', [id]);
  if (opRes.rows.length === 0) { res.status(404).json({ error: 'Production order not found' }); return; }
  const op = opRes.rows[0];

  const items = await pool.query('SELECT * FROM production_orders WHERE sheet_id = $1 ORDER BY op_number', [op.sheet_id]);
  const history = await pool.query('SELECT * FROM activity_log WHERE op_id = $1 ORDER BY created_at ASC', [id]);

  res.json({
    ...op,
    items: items.rows.map((item: any) => ({
      id: item.id, material: item.material, quantity: item.quantity,
      unit: item.unit, individual_op: item.op_number, requires_lab: item.requires_lab,
    })),
    history: history.rows,
  });
});

// POST create production order
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user;
  const validated = CreatePORequestSchema.parse(req.body);

  const lastSheet = await pool.query('SELECT sheet_number FROM production_sheets ORDER BY id DESC LIMIT 1');
  let sheetNumber = 'SHEET-001';
  if (lastSheet.rows.length > 0) {
    const lastNum = parseInt(lastSheet.rows[0].sheet_number.split('-')[1]);
    sheetNumber = `SHEET-${String(lastNum + 1).padStart(3, '0')}`;
  }

  const entryDate = validated.entry_date ? new Date(validated.entry_date) : new Date();
  const expectedDate = validated.expected_date ? new Date(validated.expected_date) : addBusinessDays(entryDate, 5);

  const sheetResult = await pool.query(
    `INSERT INTO production_sheets (sheet_number, client, color, order_number, description, entry_date, expected_date, created_by_user_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
    [sheetNumber, validated.client, validated.color, validated.order_number || null,
     validated.description || null, entryDate, expectedDate, user.id]
  );
  const sheetId = sheetResult.rows[0].id;

  const lastOP = await pool.query('SELECT op_number FROM production_orders ORDER BY id DESC LIMIT 1');
  let currentOPNum = 1;
  if (lastOP.rows.length > 0) { const n = parseInt(lastOP.rows[0].op_number); if (!isNaN(n)) currentOPNum = n + 1; }

  const createdOps: any[] = [];
  for (let i = 0; i < validated.items.length; i++) {
    const item = validated.items[i];
    const opNumber = String(currentOPNum + i).padStart(3, '0');
    const initialStatus = item.requires_fabric_quality ? 'qualidade_malhas' : 'preparacao';

    const opResult = await pool.query(
      `INSERT INTO production_orders
       (sheet_id, op_number, client, color, order_number, entry_date, expected_date, material, quantity, unit,
        requires_lab, requires_fabric_quality, status, current_stage, responsible_user_id, description,
        region_jaragua, region_brusque, region_gaspar, fiber_id, is_dual_fiber, fiber2_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22) RETURNING id`,
      [sheetId, opNumber, validated.client, validated.color, validated.order_number || null,
       entryDate, expectedDate, item.material, item.quantity || null, item.unit || null,
       item.requires_lab || false, item.requires_fabric_quality || false,
       initialStatus, 'almoxarifado', user.id, validated.description || null,
       validated.region_jaragua || false, validated.region_brusque || false, validated.region_gaspar || false,
       validated.fiber_id || null, validated.is_dual_fiber || false, validated.fiber2_id || null]
    );
    const opId = opResult.rows[0].id;
    createdOps.push({ id: opId, op_number: opNumber });

    await pool.query(
      'INSERT INTO activity_log (op_id, stage, action, user_id, details) VALUES ($1,$2,$3,$4,$5)',
      [opId, 'almoxarifado', 'created', user.id, `Criado por ${user.name}`]
    );
  }

  res.status(201).json({ op_number: createdOps[0].op_number, id: createdOps[0].id, sheet_id: sheetId });
});

// PUT update production order
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user;
  const { id } = req.params;
  const validated = CreatePORequestSchema.parse(req.body);

  const opRes = await pool.query('SELECT * FROM production_orders WHERE id = $1', [id]);
  if (opRes.rows.length === 0) { res.status(404).json({ error: 'Production order not found' }); return; }
  const sheetId = opRes.rows[0].sheet_id;

  const entryDate = validated.entry_date ? new Date(validated.entry_date) : new Date();
  const expectedDate = validated.expected_date ? new Date(validated.expected_date) : addBusinessDays(entryDate, 5);

  await pool.query(
    'UPDATE production_sheets SET client=$1, color=$2, order_number=$3, description=$4, entry_date=$5, expected_date=$6, updated_at=NOW() WHERE id=$7',
    [validated.client, validated.color, validated.order_number || null, validated.description || null, entryDate, expectedDate, sheetId]
  );

  const oldOPs = await pool.query('SELECT op_number FROM production_orders WHERE sheet_id = $1 ORDER BY op_number', [sheetId]);
  await pool.query('DELETE FROM production_orders WHERE sheet_id = $1', [sheetId]);

  const createdOps: any[] = [];
  for (let i = 0; i < validated.items.length; i++) {
    const item = validated.items[i];
    let opNumber: string;
    if (i < oldOPs.rows.length) {
      opNumber = oldOPs.rows[i].op_number;
    } else {
      const lastOP = await pool.query('SELECT op_number FROM production_orders ORDER BY id DESC LIMIT 1');
      let n = 1;
      if (lastOP.rows.length > 0) { const p = parseInt(lastOP.rows[0].op_number); if (!isNaN(p)) n = p + 1; }
      opNumber = String(n).padStart(3, '0');
    }
    const initialStatus = item.requires_fabric_quality ? 'qualidade_malhas' : 'preparacao';
    const opResult = await pool.query(
      `INSERT INTO production_orders
       (sheet_id, op_number, client, color, order_number, entry_date, expected_date, material, quantity, unit,
        requires_lab, requires_fabric_quality, status, current_stage, responsible_user_id, description,
        region_jaragua, region_brusque, region_gaspar, fiber_id, is_dual_fiber, fiber2_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22) RETURNING id`,
      [sheetId, opNumber, validated.client, validated.color, validated.order_number || null,
       entryDate, expectedDate, item.material, item.quantity || null, item.unit || null,
       item.requires_lab || false, item.requires_fabric_quality || false,
       initialStatus, 'almoxarifado', user.id, validated.description || null,
       validated.region_jaragua || false, validated.region_brusque || false, validated.region_gaspar || false,
       validated.fiber_id || null, validated.is_dual_fiber || false, validated.fiber2_id || null]
    );
    const opId = opResult.rows[0].id;
    createdOps.push({ id: opId, op_number: opNumber });
    await pool.query(
      'INSERT INTO activity_log (op_id, stage, action, user_id, details) VALUES ($1,$2,$3,$4,$5)',
      [opId, 'almoxarifado', 'updated', user.id, `Atualizado por ${user.name}`]
    );
  }

  res.json({ success: true });
});

// DELETE production order
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const opRes = await pool.query('SELECT * FROM production_orders WHERE id = $1', [id]);
  if (opRes.rows.length === 0) { res.status(404).json({ error: 'Production order not found' }); return; }
  const sheetId = opRes.rows[0].sheet_id;

  const opsToDelete = await pool.query('SELECT id FROM production_orders WHERE sheet_id = $1', [sheetId]);
  for (const op of opsToDelete.rows) {
    const opId = op.id;
    await pool.query('DELETE FROM po_preparation WHERE op_id = $1', [opId]);
    await pool.query('DELETE FROM po_production WHERE op_id = $1', [opId]);
    await pool.query('DELETE FROM po_dryer WHERE op_id = $1', [opId]);
    await pool.query('DELETE FROM po_untangling WHERE op_id = $1', [opId]);
    await pool.query('DELETE FROM po_rolling WHERE op_id = $1', [opId]);
    await pool.query('DELETE FROM po_quality WHERE op_id = $1', [opId]);
    await pool.query('DELETE FROM po_laboratory WHERE op_id = $1', [opId]);
    await pool.query('DELETE FROM activity_log WHERE op_id = $1', [opId]);
    await pool.query('DELETE FROM po_in_progress WHERE op_id = $1', [opId]);
  }
  await pool.query('DELETE FROM production_orders WHERE sheet_id = $1', [sheetId]);
  await pool.query('DELETE FROM production_sheets WHERE id = $1', [sheetId]);

  res.json({ success: true });
});

export default router;
