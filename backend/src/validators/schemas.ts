import { z } from 'zod';

export const LoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const POItemSchema = z.object({
  material: z.string().min(1),
  quantity: z.number().optional(),
  unit: z.string().optional(),
  requires_lab: z.boolean().optional().default(false),
  requires_fabric_quality: z.boolean().optional().default(false),
});

export const CreatePOSchema = z.object({
  client: z.string().min(1),
  color: z.string().min(1),
  order_number: z.string().optional(),
  entry_date: z.string().optional(),
  expected_date: z.string().optional(),
  description: z.string().optional(),
  items: z.array(POItemSchema).min(1),
  region_jaragua: z.boolean().optional().default(false),
  region_brusque: z.boolean().optional().default(false),
  region_gaspar: z.boolean().optional().default(false),
  fiber_id: z.string().uuid().nullable().optional(),
  is_dual_fiber: z.boolean().optional().default(false),
  fiber2_id: z.string().uuid().nullable().optional(),
});

export const PreparationSchema = z.object({
  po_id: z.string().uuid(),
  employee_meters: z.array(z.object({ employee_id: z.string(), meters: z.number() })),
  splices: z.array(z.string()),
  total_weight: z.number(),
  destination_box: z.string(),
  start_time: z.string(),
  end_time: z.string(),
});

export const BatchPreparationSchema = z.object({
  color: z.string(),
  employee_meters: z.array(z.object({ employee_id: z.string(), meters: z.number() })),
  splices: z.array(z.string()),
  total_weight: z.number(),
  destination_box: z.string(),
  start_time: z.string(),
  end_time: z.string(),
  ops: z.array(z.object({ op_id: z.string().uuid(), meters: z.number() })),
});

export const CreateLotsSchema = z.object({
  parent_op_id: z.string().uuid(),
  num_lots: z.number().int().min(1),
  lot_meters: z.array(z.number()),
});

export const ProductionSchema = z.object({
  po_id: z.string().uuid(),
  box_number: z.string(),
  machine: z.string(),
  operator: z.string(),
  has_adjustment: z.boolean(),
  start_date: z.string(),
  end_date: z.string(),
  meters_produced: z.number(),
});

export const DryerSchema = z.object({
  po_id: z.string().uuid(),
  destination: z.string(),
});

export const UntanglingSchema = z.object({
  po_id: z.string().uuid(),
  num_employees: z.number(),
  meters_per_employee: z.number(),
  employee_times: z.array(z.string()),
  start_time: z.string(),
  end_time: z.string(),
});

export const RollingSchema = z.object({
  po_id: z.string().uuid(),
  employee_ids: z.array(z.string()),
  num_splices: z.number(),
  num_rolls: z.number(),
  issue_description: z.string().optional(),
  start_time: z.string(),
  end_time: z.string(),
});

export const QualitySchema = z.object({
  po_id: z.string().uuid(),
  rolls_sent: z.number(),
  meters_per_roll: z.number(),
  discrepancy: z.string().optional(),
});

export const LaboratorySchema = z.object({
  po_id: z.string().uuid(),
  num_batches: z.number().optional(),
  is_recipe_ready: z.boolean(),
  recipe_origin_date: z.string().optional(),
  description: z.string().optional(),
  is_approved: z.boolean(),
  start_time: z.string(),
  end_time: z.string(),
});

export const BoxSchema = z.object({
  po_id: z.string().uuid(),
  employee_id: z.string(),
  has_adjustment: z.boolean(),
  adjustment_details: z.string().optional(),
  is_reprocess: z.boolean(),
  reprocess_reason: z.string().optional(),
  timestamp: z.string(),
});

export const CreateEmployeeSchema = z.object({
  name: z.string().min(1),
  sector: z.string().min(1),
});

export const FabricQualityInspectionSchema = z.object({
  item_description: z.string().min(1),
  weight: z.number(),
  destination_sector: z.string().min(1),
  observations: z.string().optional(),
  defect_image_url: z.string().optional(),
  employee_name: z.string().min(1),
  inspection_date: z.string(),
  priority: z.enum(['normal', 'urgent']).optional().default('normal'),
  status: z.enum(['pending', 'in_progress', 'completed']).optional().default('pending'),
});

export const UpdateUserSchema = z.object({
  role: z.string().optional(),
  is_active: z.boolean().optional(),
  name: z.string().optional(),
  email: z.string().email().optional(),
});

export const PrioritySchema = z.object({
  priority: z.number().int().min(0).max(5),
  priority_notes: z.string().optional(),
});

export const SequenceSchema = z.object({
  sequence_order: z.number().int(),
});

export const StartInProgressSchema = z.object({
  po_id: z.string().uuid(),
  stage: z.string(),
  box_number: z.string().optional(),
  machine: z.string().optional(),
});

export const ListaSaidaSchema = z.object({
  op_id: z.string().uuid(),
  exit_date: z.string(),
  exit_time: z.string().optional(),
  transportadora_id: z.string().uuid().optional(),
  regiao_id: z.string().uuid().optional(),
});

export const FiberSchema = z.object({
  name: z.string().min(1),
  is_active: z.boolean().optional().default(true),
});

export const ConfigItemSchema = z.object({
  name: z.string().min(1),
});
