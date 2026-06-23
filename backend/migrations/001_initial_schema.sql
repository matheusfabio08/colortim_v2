-- Migration 001: Schema inicial do Colortim

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'Producao',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);

-- Config tables
CREATE TABLE IF NOT EXISTS fibras (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS regioes_entrega (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transportadoras (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  sector VARCHAR(50) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Production sheets
CREATE TABLE IF NOT EXISTS production_sheets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sheet_number VARCHAR(50) UNIQUE NOT NULL,
  client VARCHAR(200) NOT NULL,
  color VARCHAR(100) NOT NULL,
  order_number VARCHAR(50),
  description TEXT,
  entry_date DATE NOT NULL,
  expected_date DATE NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Production orders
CREATE TABLE IF NOT EXISTS production_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sheet_id UUID NOT NULL REFERENCES production_sheets(id) ON DELETE CASCADE,
  op_number VARCHAR(50) UNIQUE NOT NULL,
  client VARCHAR(200) NOT NULL,
  color VARCHAR(100) NOT NULL,
  order_number VARCHAR(50),
  entry_date DATE NOT NULL,
  expected_date DATE NOT NULL,
  material VARCHAR(200),
  quantity NUMERIC(10,2),
  unit VARCHAR(20),
  requires_lab BOOLEAN NOT NULL DEFAULT FALSE,
  requires_fabric_quality BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(50) NOT NULL DEFAULT 'almoxarifado',
  current_stage VARCHAR(50) NOT NULL DEFAULT 'almoxarifado',
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  priority INTEGER NOT NULL DEFAULT 0,
  priority_notes TEXT,
  sequence_order INTEGER,
  description TEXT,
  region_jaragua BOOLEAN NOT NULL DEFAULT FALSE,
  region_brusque BOOLEAN NOT NULL DEFAULT FALSE,
  region_gaspar BOOLEAN NOT NULL DEFAULT FALSE,
  fiber_id UUID REFERENCES fibras(id) ON DELETE SET NULL,
  is_dual_fiber BOOLEAN NOT NULL DEFAULT FALSE,
  fiber2_id UUID REFERENCES fibras(id) ON DELETE SET NULL,
  lot_number INTEGER,
  parent_op_id UUID REFERENCES production_orders(id) ON DELETE SET NULL,
  lot_meters NUMERIC(10,2),
  recipe_approved BOOLEAN NOT NULL DEFAULT FALSE,
  recipe_weighed BOOLEAN NOT NULL DEFAULT FALSE,
  responsible_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_production_orders_status ON production_orders(status);
CREATE INDEX IF NOT EXISTS idx_production_orders_is_completed ON production_orders(is_completed);
CREATE INDEX IF NOT EXISTS idx_production_orders_sheet_id ON production_orders(sheet_id);
CREATE INDEX IF NOT EXISTS idx_production_orders_expected_date ON production_orders(expected_date);

-- Stage processing tables
CREATE TABLE IF NOT EXISTS po_preparation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  op_id UUID NOT NULL UNIQUE REFERENCES production_orders(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  machine_id VARCHAR(50),
  notes TEXT,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS po_production (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  op_id UUID NOT NULL UNIQUE REFERENCES production_orders(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  machine_id VARCHAR(50),
  weight NUMERIC(10,3),
  notes TEXT,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS po_dryer (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  op_id UUID NOT NULL UNIQUE REFERENCES production_orders(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  temperature NUMERIC(5,1),
  notes TEXT,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS po_untangling (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  op_id UUID NOT NULL UNIQUE REFERENCES production_orders(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  notes TEXT,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS po_rolling (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  op_id UUID NOT NULL UNIQUE REFERENCES production_orders(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  roll_count INTEGER,
  notes TEXT,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS po_quality (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  op_id UUID NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  approved BOOLEAN NOT NULL,
  rejection_reason TEXT,
  notes TEXT,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS po_laboratory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  op_id UUID NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
  num_batches INTEGER,
  is_recipe_ready BOOLEAN NOT NULL DEFAULT FALSE,
  recipe_origin_date DATE,
  description TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT FALSE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS po_box_processing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  op_id UUID NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
  box_number VARCHAR(10) NOT NULL,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  has_adjustment BOOLEAN NOT NULL DEFAULT FALSE,
  adjustment_details TEXT,
  is_reprocess BOOLEAN NOT NULL DEFAULT FALSE,
  reprocess_reason TEXT,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS po_pesagem (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  op_id UUID NOT NULL UNIQUE REFERENCES production_orders(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  notes TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS po_in_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  op_id UUID NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
  stage VARCHAR(50) NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (op_id, stage)
);

CREATE TABLE IF NOT EXISTS preparation_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_number VARCHAR(50) UNIQUE NOT NULL,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  op_id UUID NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
  stage VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_op_id ON activity_log(op_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at);

CREATE TABLE IF NOT EXISTS lista_saida (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  op_id UUID NOT NULL UNIQUE REFERENCES production_orders(id) ON DELETE CASCADE,
  exit_date DATE NOT NULL,
  exit_time TIME,
  transportadora_id UUID REFERENCES transportadoras(id) ON DELETE SET NULL,
  regiao_id UUID REFERENCES regioes_entrega(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fabric_quality_inspections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inspection_number VARCHAR(50) UNIQUE NOT NULL,
  item_description VARCHAR(255) NOT NULL,
  weight NUMERIC(10,3) NOT NULL,
  destination_sector VARCHAR(100) NOT NULL,
  observations TEXT,
  defect_image_url TEXT,
  employee_name VARCHAR(100) NOT NULL,
  inspection_date DATE NOT NULL,
  priority VARCHAR(20) NOT NULL DEFAULT 'normal',
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
