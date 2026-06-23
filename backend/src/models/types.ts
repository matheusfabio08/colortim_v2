export type POStatus =
  | 'almoxarifado'
  | 'qualidade_malhas'
  | 'preparacao'
  | 'box4'
  | 'box5'
  | 'box6'
  | 'producao'
  | 'secadora'
  | 'destrinchagem'
  | 'enrolagem'
  | 'qualidade'
  | 'concluido';

export type UserRole =
  | 'Admin'
  | 'PCP'
  | 'Almoxarifado'
  | 'Preparacao'
  | 'Producao'
  | 'Laboratorio'
  | 'Qualidade'
  | 'Pesagem';

export interface User {
  id: string;
  username: string;
  password_hash: string;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ProductionSheet {
  id: string;
  sheet_number: string;
  client: string;
  color: string;
  order_number?: string;
  description?: string;
  entry_date: Date;
  expected_date: Date;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface ProductionOrder {
  id: string;
  sheet_id: string;
  op_number: string;
  client: string;
  color: string;
  order_number?: string;
  entry_date: Date;
  expected_date: Date;
  material?: string;
  quantity?: number;
  unit?: string;
  requires_lab: boolean;
  requires_fabric_quality: boolean;
  status: POStatus;
  current_stage: string;
  is_completed: boolean;
  priority: number;
  priority_notes?: string;
  sequence_order?: number;
  description?: string;
  region_jaragua: boolean;
  region_brusque: boolean;
  region_gaspar: boolean;
  fiber_id?: string;
  is_dual_fiber: boolean;
  fiber2_id?: string;
  lot_number?: number;
  parent_op_id?: string;
  lot_meters?: number;
  recipe_approved: boolean;
  recipe_weighed: boolean;
  responsible_user_id?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Employee {
  id: string;
  name: string;
  sector: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ActivityLog {
  id: string;
  op_id: string;
  stage: string;
  action: string;
  user_id?: string;
  details?: string;
  created_at: Date;
}

export interface FabricQualityInspection {
  id: string;
  inspection_number: string;
  item_description: string;
  weight: number;
  destination_sector: string;
  observations?: string;
  defect_image_url?: string;
  employee_name: string;
  inspection_date: string;
  priority: 'normal' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed';
  created_at: Date;
  updated_at: Date;
}

export interface AuthenticatedUser {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
}
