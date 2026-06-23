import { z } from 'zod';

export const LoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const CreateProductionOrderSchema = z.object({
  client: z.string().min(1),
  color: z.string().min(1),
  order_number: z.string().optional(),
  description: z.string().optional(),
  entry_date: z.string().optional(),
  expected_date: z.string().optional(),
  requires_fabric_quality: z.boolean().default(false),
  region_jaragua: z.boolean().default(false),
  region_brusque: z.boolean().default(false),
  region_gaspar: z.boolean().default(false),
  fiber_id: z.string().uuid().optional(),
  is_dual_fiber: z.boolean().default(false),
  fiber2_id: z.string().uuid().optional(),
  items: z.array(z.object({
    material: z.string().min(1),
    quantity: z.number().positive(),
    unit: z.string().min(1),
    requires_lab: z.boolean().default(false),
    lot_meters: z.number().optional(),
  })).min(1),
});

export const PreparationSchema = z.object({
  po_id: z.string().uuid(),
  employee_id: z.string().uuid(),
  machine_id: z.string().optional(),
  notes: z.string().optional(),
  timestamp: z.string(),
});

export const BatchPreparationSchema = z.object({
  op_ids: z.array(z.string().uuid()).min(1),
  employee_id: z.string().uuid(),
  notes: z.string().optional(),
  timestamp: z.string(),
});

export const CreateLotsSchema = z.object({
  po_id: z.string().uuid(),
  num_lots: z.number().int().positive(),
});

export const ProductionSchema = z.object({
  po_id: z.string().uuid(),
  employee_id: z.string().uuid(),
  machine_id: z.string().optional(),
  notes: z.string().optional(),
  timestamp: z.string(),
  weight: z.number().optional(),
});

export const DryerSchema = z.object({
  po_id: z.string().uuid(),
  employee_id: z.string().uuid(),
  temperature: z.number().optional(),
  notes: z.string().optional(),
  timestamp: z.string(),
});

export const UntanglingSchema = z.object({
  po_id: z.string().uuid(),
  employee_id: z.string().uuid(),
  notes: z.string().optional(),
  timestamp: z.string(),
});

export const RollingSchema = z.object({
  po_id: z.string().uuid(),
  employee_id: z.string().uuid(),
  roll_count: z.number().int().optional(),
  notes: z.string().optional(),
  timestamp: z.string(),
});

export const QualitySchema = z.object({
  po_id: z.string().uuid(),
  employee_id: z.string().uuid(),
  approved: z.boolean(),
  rejection_reason: z.string().optional(),
  notes: z.string().optional(),
  timestamp: z.string(),
});

export const LaboratorySchema = z.object({
  po_id: z.string().uuid(),
  num_batches: z.number().int().positive().optional(),
  is_recipe_ready: z.boolean(),
  recipe_origin_date: z.string().optional(),
  description: z.string().optional(),
  is_approved: z.boolean(),
  start_time: z.string(),
  end_time: z.string(),
});

export const BoxSchema = z.object({
  po_id: z.string().uuid(),
  employee_id: z.string().uuid(),
  has_adjustment: z.boolean().default(false),
  adjustment_details: z.string().optional(),
  is_reprocess: z.boolean().default(false),
  reprocess_reason: z.string().optional(),
  timestamp: z.string(),
});

export const FabricQualityInspectionSchema = z.object({
  item_description: z.string().min(1),
  weight: z.number().positive(),
  destination_sector: z.string().min(1),
  observations: z.string().optional(),
  defect_image_url: z.string().optional(),
  employee_name: z.string().min(1),
  inspection_date: z.string(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  status: z.enum(['pending', 'in_progress', 'completed', 'rejected']).default('pending'),
});

export const CreateUserSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6),
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['Admin','PCP','Almoxarifado','Preparacao','Producao','Laboratorio','Qualidade','Pesagem']),
});
