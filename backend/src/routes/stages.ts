import { Router, Response } from 'express';
import pool from '../db/pool';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import {
  PreparationRequestSchema, BatchPreparationRequestSchema,
  ProductionRequestSchema, DryerRequestSchema, UntanglingRequestSchema,
  RollingRequestSchema, QualityRequestSchema, LaboratoryRequestSchema,
  Box4RequestSchema, Box5RequestSchema, Box6RequestSchema,
} from '../shared/types';

const router = Router();
router.use(authMiddleware);

// OP in progress
router.post('/op-start', async (req: AuthRequest, res: Response): Promise<void> => {
  const { op_id, stage, box_number, machine } = req.body;
  if (!op_id || !stage) { res.status(400).json({ error: 'Missing op_id or stage' }); return; }
  const existing = await pool.query('SELECT id FROM po_in_progress WHERE op_id = $1 AND stage = $2', [op_id, stage]);
  if (existing.rows.length > 0) { res.status(400).json({ error: 'OP already in progress' }); return; }
  await pool.query('INSERT INTO po_in_progress (op_id, stage, box_number, machine) VALUES ($1,$2,$3,$4)', [op_id, stage, box_number || null, machine || null]);
  res.json({ success: true, started_at: new Date().toISOString() });
});

router.post('/op-stop', async (req: AuthRequest, res: Response): Promise<void> => {
  const { op_id, stage } = req.body;
  if (!op_id || !stage) { res.status(400).json({ error: 'Missing op_id or stage' }); return; }
  const inProgress = await pool.query('SELECT * FROM po_in_progress WHERE op_id = $1 AND stage = $2', [op_id, stage]);
  if (inProgress.rows.length === 0) { res.status(400).json({ error: 'OP not in progress' }); return; }
  await pool.query('DELETE FROM po_in_progress WHERE op_id = $1 AND stage = $2', [op_id, stage]);
  const r = inProgress.rows[0];
  res.json({ success: true, started_at: r.started_at, stopped_at: new Date().toISOString(), box_number: r.box_number, machine: r.machine });
});

router.get('/op-status/:id/:stage', async (req: AuthRequest, res: Response): Promise<void> => {
  const { id, stage } = req.params;
  const r = await pool.query('SELECT * FROM po_in_progress WHERE op_id = $1 AND stage = $2', [id, stage]);
  const row = r.rows[0];
  res.json({ in_progress: !!row, started_at: row?.started_at || null, box_number: row?.box_number || null, machine: row?.machine || null });
});

// Preparation
router.post('/preparation', async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user;
  const validated = PreparationRequestSchema.parse(req.body);
  await pool.query(
    'INSERT INTO po_preparation (op_id, employee_ids, start_time, end_time, splices, total_weight, destination_box) VALUES ($1,$2,$3,$4,$5,$6,$7)',
    [validated.po_id, JSON.stringify(validated.employee_meters), validated.start_time,
     validated.end_time, JSON.stringify(validated.splices), validated.total_weight, validated.destination_box]
  );
  let nextStatus = 'producao';
  if (validated.destination_box === 'Box 4') nextStatus = 'box4';
  else if (validated.destination_box === 'Box 5') nextStatus = 'box5';
  else if (validated.destination_box === 'Box 6') nextStatus = 'box6';
  await pool.query('UPDATE production_orders SET status=$1, current_stage=$2, updated_at=NOW() WHERE id=$3', [nextStatus, 'preparacao', validated.po_id]);
  await pool.query('INSERT INTO activity_log (op_id, stage, action, user_id) VALUES ($1,$2,$3,$4)', [validated.po_id, 'preparacao', 'completed', user.id]);
  res.json({ success: true });
});

// Batch preparation
router.post('/preparation/batch', async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user;
  const validated = BatchPreparationRequestSchema.parse(req.body);
  const lastBatch = await pool.query('SELECT batch_number FROM preparation_batches ORDER BY id DESC LIMIT 1');
  let batchNumber = 'LOTE-001';
  if (lastBatch.rows.length > 0) {
    const n = parseInt(lastBatch.rows[0].batch_number.split('-')[1]);
    batchNumber = `LOTE-${String(n + 1).padStart(3, '0')}`;
  }
  const batchResult = await pool.query(
    'INSERT INTO preparation_batches (batch_number, color, total_weight, destination_box, employee_ids, splices, start_time, end_time) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id',
    [batchNumber, validated.color, validated.total_weight, validated.destination_box,
     JSON.stringify(validated.employee_meters), JSON.stringify(validated.splices), validated.start_time, validated.end_time]
  );
  const batchId = batchResult.rows[0].id;
  for (const op of validated.ops) {
    await pool.query('INSERT INTO batch_ops (batch_id, op_id, meters_in_batch) VALUES ($1,$2,$3)', [batchId, op.op_id, op.meters]);
    await pool.query(
      'INSERT INTO po_preparation (op_id, employee_ids, start_time, end_time, splices, total_weight, destination_box) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [op.op_id, JSON.stringify(validated.employee_meters), validated.start_time,
       validated.end_time, JSON.stringify(validated.splices), op.meters, validated.destination_box]
    );
    let nextStatus = 'producao';
    if (validated.destination_box === 'Box 4') nextStatus = 'box4';
    else if (validated.destination_box === 'Box 5') nextStatus = 'box5';
    else if (validated.destination_box === 'Box 6') nextStatus = 'box6';
    await pool.query('UPDATE production_orders SET status=$1, current_stage=$2, updated_at=NOW() WHERE id=$3', [nextStatus, 'preparacao', op.op_id]);
    await pool.query('INSERT INTO activity_log (op_id, stage, action, user_id, details) VALUES ($1,$2,$3,$4,$5)', [op.op_id, 'preparacao', 'completed_in_batch', user.id, `Lote ${batchNumber}`]);
  }
  res.json({ success: true, batch_number: batchNumber });
});

router.get('/preparation/available-for-batch', async (req: AuthRequest, res: Response): Promise<void> => {
  const { color } = req.query;
  if (!color) { res.status(400).json({ error: 'Color parameter required' }); return; }
  const r = await pool.query("SELECT * FROM production_orders WHERE color = $1 AND status = 'preparacao' ORDER BY entry_date ASC", [color]);
  res.json(r.rows);
});

// Production
router.post('/production', async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user;
  const validated = ProductionRequestSchema.parse(req.body);
  await pool.query(
    'INSERT INTO po_production (op_id, box_number, machine, operator, has_adjustment, start_date, end_date, meters_produced) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
    [validated.po_id, validated.box_number, validated.machine, validated.operator, validated.has_adjustment, validated.start_date, validated.end_date, validated.meters_produced]
  );
  await pool.query('UPDATE production_orders SET status=$1, current_stage=$2, updated_at=NOW() WHERE id=$3', ['secadora', 'producao', validated.po_id]);
  await pool.query('INSERT INTO activity_log (op_id, stage, action, user_id) VALUES ($1,$2,$3,$4)', [validated.po_id, 'producao', 'completed', user.id]);
  res.json({ success: true });
});

// Dryer
router.post('/dryer', async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user;
  const validated = DryerRequestSchema.parse(req.body);
  await pool.query('INSERT INTO po_dryer (op_id, destination) VALUES ($1,$2)', [validated.po_id, validated.destination]);
  await pool.query('UPDATE production_orders SET status=$1, current_stage=$2, updated_at=NOW() WHERE id=$3', [validated.destination, 'secadora', validated.po_id]);
  await pool.query('INSERT INTO activity_log (op_id, stage, action, user_id) VALUES ($1,$2,$3,$4)', [validated.po_id, 'secadora', 'completed', user.id]);
  res.json({ success: true });
});

// Untangling
router.post('/untangling', async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user;
  const validated = UntanglingRequestSchema.parse(req.body);
  await pool.query(
    'INSERT INTO po_untangling (op_id, num_employees, meters_per_employee, employee_times, start_time, end_time) VALUES ($1,$2,$3,$4,$5,$6)',
    [validated.po_id, validated.num_employees, validated.meters_per_employee, JSON.stringify(validated.employee_times), validated.start_time, validated.end_time]
  );
  await pool.query('UPDATE production_orders SET status=$1, current_stage=$2, updated_at=NOW() WHERE id=$3', ['enrolagem', 'destrinchagem', validated.po_id]);
  await pool.query('INSERT INTO activity_log (op_id, stage, action, user_id) VALUES ($1,$2,$3,$4)', [validated.po_id, 'destrinchagem', 'completed', user.id]);
  res.json({ success: true });
});

// Rolling
router.post('/rolling', async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user;
  const validated = RollingRequestSchema.parse(req.body);
  await pool.query(
    'INSERT INTO po_rolling (op_id, employee_ids, num_splices, num_rolls, issue_description, start_time, end_time) VALUES ($1,$2,$3,$4,$5,$6,$7)',
    [validated.po_id, JSON.stringify(validated.employee_ids), validated.num_splices, validated.num_rolls, validated.issue_description || null, validated.start_time, validated.end_time]
  );
  await pool.query('UPDATE production_orders SET status=$1, current_stage=$2, updated_at=NOW() WHERE id=$3', ['qualidade', 'enrolagem', validated.po_id]);
  await pool.query('INSERT INTO activity_log (op_id, stage, action, user_id) VALUES ($1,$2,$3,$4)', [validated.po_id, 'enrolagem', 'completed', user.id]);
  res.json({ success: true });
});

// Quality
router.post('/quality', async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user;
  const validated = QualityRequestSchema.parse(req.body);
  await pool.query(
    'INSERT INTO po_quality (op_id, rolls_sent, meters_per_roll, discrepancy) VALUES ($1,$2,$3,$4)',
    [validated.po_id, validated.rolls_sent, validated.meters_per_roll, validated.discrepancy || null]
  );
  await pool.query('UPDATE production_orders SET status=$1, current_stage=$2, is_completed=true, updated_at=NOW() WHERE id=$3', ['concluido', 'qualidade', validated.po_id]);
  await pool.query('INSERT INTO activity_log (op_id, stage, action, user_id) VALUES ($1,$2,$3,$4)', [validated.po_id, 'qualidade', 'completed', user.id]);
  res.json({ success: true });
});

// Laboratory
router.post('/laboratory', async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user;
  const validated = LaboratoryRequestSchema.parse(req.body);
  await pool.query(
    'INSERT INTO po_laboratory (op_id, num_batches, is_recipe_ready, recipe_origin_date, description, is_approved, start_time, end_time) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
    [validated.po_id, validated.num_batches || null, validated.is_recipe_ready,
     validated.recipe_origin_date || null, validated.description || null,
     validated.is_approved, validated.start_time, validated.end_time]
  );
  await pool.query('INSERT INTO activity_log (op_id, stage, action, user_id) VALUES ($1,$2,$3,$4)', [validated.po_id, 'laboratorio', validated.is_approved ? 'approved' : 'processed', user.id]);
  res.json({ success: true });
});

router.delete('/laboratory/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  await pool.query('DELETE FROM po_laboratory WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

router.get('/laboratory/records', async (_req: AuthRequest, res: Response): Promise<void> => {
  const r = await pool.query(`
    SELECT po.*, lab.id as lab_record_id, lab.num_batches, lab.is_recipe_ready,
           lab.recipe_origin_date, lab.description as lab_description, lab.is_approved,
           lab.start_time as lab_start_time, lab.end_time as lab_end_time, lab.created_at as lab_processed_at
    FROM production_orders po
    LEFT JOIN po_laboratory lab ON po.id = lab.op_id
    WHERE po.requires_lab = true AND po.lot_number IS NULL AND po.parent_op_id IS NULL
    ORDER BY po.created_at DESC
  `);
  res.json(r.rows);
});

router.get('/laboratory/kpis', async (_req: AuthRequest, res: Response): Promise<void> => {
  const total = await pool.query('SELECT COUNT(*) as count FROM po_laboratory');
  const ready = await pool.query('SELECT COUNT(*) as count FROM po_laboratory WHERE is_recipe_ready = true');
  const newR = await pool.query('SELECT COUNT(*) as count FROM po_laboratory WHERE is_recipe_ready = false OR is_recipe_ready IS NULL');
  const avg = await pool.query('SELECT AVG(num_batches) as avg FROM po_laboratory WHERE num_batches IS NOT NULL AND num_batches > 0');
  const totalB = await pool.query('SELECT SUM(num_batches) as total FROM po_laboratory WHERE num_batches IS NOT NULL');
  const onTime = await pool.query("SELECT COUNT(*) as count FROM po_laboratory WHERE end_time - start_time <= interval '2 days'");
  const pending = await pool.query(`
    SELECT COUNT(*) as count FROM production_orders
    WHERE requires_lab = true AND lot_number IS NULL AND parent_op_id IS NULL
    AND id NOT IN (SELECT op_id FROM po_laboratory)
  `);
  const t = parseInt(total.rows[0].count);
  const ot = parseInt(onTime.rows[0].count);
  res.json({
    total_completed: t, ready_recipes: parseInt(ready.rows[0].count),
    new_recipes: parseInt(newR.rows[0].count),
    avg_batches: Math.round((parseFloat(avg.rows[0].avg) || 0) * 10) / 10,
    total_batches: parseInt(totalB.rows[0].total) || 0,
    on_time_count: ot, pending_ops: parseInt(pending.rows[0].count),
    yield_rate: t > 0 ? Math.round((ot / t) * 100) : 0,
  });
});

// Box 4
router.post('/box4', async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user;
  const validated = Box4RequestSchema.parse(req.body);
  await pool.query(
    'INSERT INTO po_box4 (po_id, employee_id, has_adjustment, adjustment_details, is_reprocess, reprocess_reason, timestamp) VALUES ($1,$2,$3,$4,$5,$6,$7)',
    [validated.po_id, validated.employee_id, validated.has_adjustment, validated.adjustment_details || null, validated.is_reprocess, validated.reprocess_reason || null, validated.timestamp]
  );
  await pool.query('UPDATE production_orders SET status=$1, current_stage=$2, updated_at=NOW() WHERE id=$3', ['producao', 'box4', validated.po_id]);
  await pool.query('INSERT INTO activity_log (op_id, stage, action, user_id) VALUES ($1,$2,$3,$4)', [validated.po_id, 'box4', 'processed', user.id]);
  res.json({ success: true });
});

router.get('/box4/records', async (_req: AuthRequest, res: Response): Promise<void> => {
  const waiting = await pool.query("SELECT * FROM production_orders WHERE status = 'box4' ORDER BY created_at ASC");
  const inProgress: any[] = [];
  for (const op of waiting.rows) {
    const s = await pool.query("SELECT id FROM po_in_progress WHERE op_id = $1 AND stage = 'box4'", [op.id]);
    if (s.rows.length > 0) inProgress.push(op);
  }
  const waitingData = waiting.rows.filter((op: any) => !inProgress.find((ip: any) => ip.id === op.id));
  const now = new Date();
  const allOPs = await pool.query('SELECT * FROM production_orders ORDER BY created_at DESC');
  const completed = allOPs.rows.filter((op: any) => {
    if (op.status !== 'producao' || op.current_stage !== 'box4') return false;
    return (now.getTime() - new Date(op.updated_at).getTime()) / 3600000 <= 24;
  });
  res.json({ waiting: waitingData, inProgress, completed });
});

// Box 5
router.post('/box5', async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user;
  const validated = Box5RequestSchema.parse(req.body);
  await pool.query(
    'INSERT INTO po_box5 (po_id, employee_id, has_adjustment, adjustment_details, is_reprocess, reprocess_reason, timestamp) VALUES ($1,$2,$3,$4,$5,$6,$7)',
    [validated.po_id, validated.employee_id, validated.has_adjustment, validated.adjustment_details || null, validated.is_reprocess, validated.reprocess_reason || null, validated.timestamp]
  );
  await pool.query('UPDATE production_orders SET status=$1, current_stage=$2, updated_at=NOW() WHERE id=$3', ['producao', 'box5', validated.po_id]);
  await pool.query('INSERT INTO activity_log (op_id, stage, action, user_id) VALUES ($1,$2,$3,$4)', [validated.po_id, 'box5', 'processed', user.id]);
  res.json({ success: true });
});

router.get('/box5/records', async (_req: AuthRequest, res: Response): Promise<void> => {
  const waiting = await pool.query("SELECT * FROM production_orders WHERE status = 'box5' ORDER BY created_at ASC");
  const inProgress: any[] = [];
  for (const op of waiting.rows) {
    const s = await pool.query("SELECT id FROM po_in_progress WHERE op_id = $1 AND stage = 'box5'", [op.id]);
    if (s.rows.length > 0) inProgress.push(op);
  }
  const waitingData = waiting.rows.filter((op: any) => !inProgress.find((ip: any) => ip.id === op.id));
  const now = new Date();
  const allOPs = await pool.query('SELECT * FROM production_orders ORDER BY created_at DESC');
  const completed = allOPs.rows.filter((op: any) => {
    if (op.status !== 'producao' || op.current_stage !== 'box5') return false;
    return (now.getTime() - new Date(op.updated_at).getTime()) / 3600000 <= 24;
  });
  res.json({ waiting: waitingData, inProgress, completed });
});

// Box 6
router.post('/box6', async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user;
  const validated = Box6RequestSchema.parse(req.body);
  await pool.query(
    'INSERT INTO po_box6 (po_id, employee_id, has_adjustment, adjustment_details, is_reprocess, reprocess_reason, timestamp) VALUES ($1,$2,$3,$4,$5,$6,$7)',
    [validated.po_id, validated.employee_id, validated.has_adjustment, validated.adjustment_details || null, validated.is_reprocess, validated.reprocess_reason || null, validated.timestamp]
  );
  await pool.query('UPDATE production_orders SET status=$1, current_stage=$2, updated_at=NOW() WHERE id=$3', ['producao', 'box6', validated.po_id]);
  await pool.query('INSERT INTO activity_log (op_id, stage, action, user_id) VALUES ($1,$2,$3,$4)', [validated.po_id, 'box6', 'processed', user.id]);
  res.json({ success: true });
});

router.get('/box6/records', async (_req: AuthRequest, res: Response): Promise<void> => {
  const waiting = await pool.query("SELECT * FROM production_orders WHERE status = 'box6' ORDER BY created_at ASC");
  const inProgress: any[] = [];
  for (const op of waiting.rows) {
    const s = await pool.query("SELECT id FROM po_in_progress WHERE op_id = $1 AND stage = 'box6'", [op.id]);
    if (s.rows.length > 0) inProgress.push(op);
  }
  const waitingData = waiting.rows.filter((op: any) => !inProgress.find((ip: any) => ip.id === op.id));
  const now = new Date();
  const allOPs = await pool.query('SELECT * FROM production_orders ORDER BY created_at DESC');
  const completed = allOPs.rows.filter((op: any) => {
    if (op.status !== 'producao' || op.current_stage !== 'box6') return false;
    return (now.getTime() - new Date(op.updated_at).getTime()) / 3600000 <= 24;
  });
  res.json({ waiting: waitingData, inProgress, completed });
});

export default router;
