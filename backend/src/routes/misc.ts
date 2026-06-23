import { Router, Response } from 'express';
import pool from '../db/pool';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { FabricQualityInspectionSchema } from '../shared/types';

const router = Router();
router.use(authMiddleware);

// Fibras
router.get('/fibras', async (_req: AuthRequest, res: Response): Promise<void> => {
  const r = await pool.query('SELECT * FROM fibras ORDER BY name ASC');
  res.json(r.rows);
});
router.post('/fibras', async (req: AuthRequest, res: Response): Promise<void> => {
  const { name } = req.body;
  if (!name) { res.status(400).json({ error: 'Nome é obrigatório' }); return; }
  await pool.query('INSERT INTO fibras (name) VALUES ($1)', [name]);
  res.status(201).json({ success: true });
});
router.put('/fibras/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, is_active } = req.body;
  await pool.query('UPDATE fibras SET name=$1, is_active=$2, updated_at=NOW() WHERE id=$3', [name, is_active, req.params.id]);
  res.json({ success: true });
});
router.delete('/fibras/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  await pool.query('DELETE FROM fibras WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

// Transportadoras
router.get('/transportadoras', async (_req: AuthRequest, res: Response): Promise<void> => {
  const r = await pool.query('SELECT * FROM transportadoras ORDER BY name ASC');
  res.json(r.rows);
});
router.post('/transportadoras', async (req: AuthRequest, res: Response): Promise<void> => {
  const { name } = req.body;
  if (!name) { res.status(400).json({ error: 'Nome é obrigatório' }); return; }
  await pool.query('INSERT INTO transportadoras (name) VALUES ($1)', [name]);
  res.status(201).json({ success: true });
});
router.put('/transportadoras/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, is_active } = req.body;
  await pool.query('UPDATE transportadoras SET name=$1, is_active=$2, updated_at=NOW() WHERE id=$3', [name, is_active, req.params.id]);
  res.json({ success: true });
});
router.delete('/transportadoras/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  await pool.query('DELETE FROM transportadoras WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

// Regiões
router.get('/regioes', async (_req: AuthRequest, res: Response): Promise<void> => {
  const r = await pool.query('SELECT * FROM regioes_entrega ORDER BY name ASC');
  res.json(r.rows);
});
router.post('/regioes', async (req: AuthRequest, res: Response): Promise<void> => {
  const { name } = req.body;
  if (!name) { res.status(400).json({ error: 'Nome é obrigatório' }); return; }
  await pool.query('INSERT INTO regioes_entrega (name) VALUES ($1)', [name]);
  res.status(201).json({ success: true });
});
router.put('/regioes/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, is_active } = req.body;
  await pool.query('UPDATE regioes_entrega SET name=$1, is_active=$2, updated_at=NOW() WHERE id=$3', [name, is_active, req.params.id]);
  res.json({ success: true });
});
router.delete('/regioes/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  await pool.query('DELETE FROM regioes_entrega WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

// Lista de Saída
router.get('/lista-saida', async (_req: AuthRequest, res: Response): Promise<void> => {
  const r = await pool.query(`
    SELECT ls.*, po.op_number, po.client, po.color, po.material, po.quantity, po.unit,
           t.name as transportadora_name, re.name as regiao_name
    FROM lista_saida ls
    JOIN production_orders po ON ls.op_id = po.id
    LEFT JOIN transportadoras t ON ls.transportadora_id = t.id
    LEFT JOIN regioes_entrega re ON ls.regiao_id = re.id
    ORDER BY ls.exit_date ASC
  `);
  res.json(r.rows);
});
router.post('/lista-saida', async (req: AuthRequest, res: Response): Promise<void> => {
  const { op_id, exit_date, exit_time, transportadora_id, regiao_id } = req.body;
  if (!op_id || !exit_date) { res.status(400).json({ error: 'OP e data de saída são obrigatórios' }); return; }
  const existing = await pool.query('SELECT id FROM lista_saida WHERE op_id = $1', [op_id]);
  if (existing.rows.length > 0) { res.status(400).json({ error: 'OP já está na lista de saída' }); return; }
  await pool.query('INSERT INTO lista_saida (op_id, exit_date, exit_time, transportadora_id, regiao_id) VALUES ($1,$2,$3,$4,$5)', [op_id, exit_date, exit_time || null, transportadora_id || null, regiao_id || null]);
  res.json({ success: true });
});
router.put('/lista-saida/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const { exit_date, transportadora_id, regiao_id } = req.body;
  await pool.query('UPDATE lista_saida SET exit_date=$1, transportadora_id=$2, regiao_id=$3, updated_at=NOW() WHERE id=$4', [exit_date, transportadora_id || null, regiao_id || null, req.params.id]);
  res.json({ success: true });
});
router.delete('/lista-saida/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  await pool.query('DELETE FROM lista_saida WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

// Fabric Quality
router.get('/fabric-quality/inspections', async (_req: AuthRequest, res: Response): Promise<void> => {
  const r = await pool.query('SELECT * FROM fabric_quality_inspections ORDER BY inspection_date DESC');
  res.json(r.rows);
});
router.get('/fabric-quality/inspections/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const r = await pool.query('SELECT * FROM fabric_quality_inspections WHERE id = $1', [req.params.id]);
  if (r.rows.length === 0) { res.status(404).json({ error: 'Inspection not found' }); return; }
  res.json(r.rows[0]);
});
router.post('/fabric-quality/inspections', async (req: AuthRequest, res: Response): Promise<void> => {
  const validated = FabricQualityInspectionSchema.parse(req.body);
  const last = await pool.query('SELECT inspection_number FROM fabric_quality_inspections ORDER BY id DESC LIMIT 1');
  let inspNum = 'INS-001';
  if (last.rows.length > 0) {
    const n = parseInt(last.rows[0].inspection_number.split('-')[1]);
    inspNum = `INS-${String(n + 1).padStart(3, '0')}`;
  }
  await pool.query(
    'INSERT INTO fabric_quality_inspections (inspection_number, item_description, weight, destination_sector, observations, defect_image_url, employee_name, inspection_date, priority, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
    [inspNum, validated.item_description, validated.weight, validated.destination_sector,
     validated.observations || null, validated.defect_image_url || null, validated.employee_name,
     validated.inspection_date, validated.priority || 'normal', validated.status || 'pending']
  );
  res.status(201).json({ success: true, inspection_number: inspNum });
});
router.put('/fabric-quality/inspections/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const validated = FabricQualityInspectionSchema.parse(req.body);
  await pool.query(
    'UPDATE fabric_quality_inspections SET item_description=$1, weight=$2, destination_sector=$3, observations=$4, defect_image_url=$5, employee_name=$6, inspection_date=$7, updated_at=NOW() WHERE id=$8',
    [validated.item_description, validated.weight, validated.destination_sector,
     validated.observations || null, validated.defect_image_url || null,
     validated.employee_name, validated.inspection_date, req.params.id]
  );
  res.json({ success: true });
});
router.delete('/fabric-quality/inspections/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  await pool.query('DELETE FROM fabric_quality_inspections WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

// Pesagem
router.get('/pesagem/records', async (_req: AuthRequest, res: Response): Promise<void> => {
  const waiting = await pool.query(`
    SELECT po.*, lab.id as lab_record_id FROM production_orders po
    INNER JOIN po_laboratory lab ON po.id = lab.op_id
    LEFT JOIN po_pesagem pes ON po.id = pes.op_id
    WHERE po.requires_lab = true AND po.lot_number IS NULL AND po.parent_op_id IS NULL
      AND po.recipe_weighed = false AND pes.id IS NULL ORDER BY po.created_at DESC
  `);
  const inProgress = await pool.query(`
    SELECT po.*, pes.id as pesagem_id, pes.start_time as pesagem_start_time, pes.end_time as pesagem_end_time
    FROM production_orders po INNER JOIN po_pesagem pes ON po.id = pes.op_id
    WHERE po.requires_lab = true AND pes.start_time IS NOT NULL AND pes.end_time IS NULL ORDER BY pes.start_time DESC
  `);
  const completed = await pool.query(`
    SELECT po.*, pes.id as pesagem_id, pes.start_time as pesagem_start_time, pes.end_time as pesagem_end_time
    FROM production_orders po INNER JOIN po_pesagem pes ON po.id = pes.op_id
    WHERE po.requires_lab = true AND pes.end_time IS NOT NULL ORDER BY pes.end_time DESC LIMIT 50
  `);
  res.json({ waiting: waiting.rows, inProgress: inProgress.rows, completed: completed.rows });
});
router.post('/pesagem/start', async (req: AuthRequest, res: Response): Promise<void> => {
  const { op_id } = req.body;
  if (!op_id) { res.status(400).json({ error: 'op_id is required' }); return; }
  await pool.query('UPDATE production_orders SET recipe_approved=true, updated_at=NOW() WHERE id=$1', [op_id]);
  await pool.query('INSERT INTO po_pesagem (op_id, start_time) VALUES ($1, NOW())', [op_id]);
  res.status(201).json({ success: true });
});
router.post('/pesagem/finish', async (req: AuthRequest, res: Response): Promise<void> => {
  const { op_id, employee_id, notes } = req.body;
  if (!op_id || !employee_id) { res.status(400).json({ error: 'op_id and employee_id are required' }); return; }
  await pool.query('UPDATE po_pesagem SET end_time=NOW(), employee_id=$1, notes=$2, updated_at=NOW() WHERE op_id=$3 AND end_time IS NULL', [employee_id, notes || null, op_id]);
  await pool.query('UPDATE production_orders SET recipe_weighed=true, updated_at=NOW() WHERE id=$1', [op_id]);
  res.json({ success: true });
});

// PCP
router.put('/pcp/priority/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const { priority, priority_notes } = req.body;
  await pool.query('UPDATE production_orders SET priority=$1, priority_notes=$2, updated_at=NOW() WHERE id=$3', [priority, priority_notes || null, req.params.id]);
  res.json({ success: true });
});
router.put('/pcp/sequence/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const { sequence_order } = req.body;
  await pool.query('UPDATE production_orders SET sequence_order=$1, updated_at=NOW() WHERE id=$2', [sequence_order, req.params.id]);
  res.json({ success: true });
});
router.get('/pcp/overdue-ops', async (_req: AuthRequest, res: Response): Promise<void> => {
  const today = new Date().toISOString().split('T')[0];
  const r = await pool.query("SELECT * FROM production_orders WHERE is_completed = false AND expected_date < $1 ORDER BY expected_date ASC", [today]);
  res.json(r.rows);
});
router.get('/pcp/priority-ops', async (_req: AuthRequest, res: Response): Promise<void> => {
  const r = await pool.query('SELECT * FROM production_orders WHERE is_completed = false AND priority > 0 ORDER BY priority DESC, expected_date ASC');
  res.json(r.rows);
});
router.get('/pcp/capacity-analysis', async (_req: AuthRequest, res: Response): Promise<void> => {
  const stages = ['preparacao', 'producao', 'secadora', 'destrinchagem', 'enrolagem', 'qualidade'];
  const capacity: any = {};
  for (const stage of stages) {
    const count = await pool.query('SELECT COUNT(*) as count FROM production_orders WHERE status = $1 AND is_completed = false', [stage]);
    const urgent = await pool.query('SELECT COUNT(*) as count FROM production_orders WHERE status = $1 AND is_completed = false AND priority >= 3', [stage]);
    capacity[stage] = { total: parseInt(count.rows[0].count), urgent: parseInt(urgent.rows[0].count) };
  }
  res.json(capacity);
});

export default router;
