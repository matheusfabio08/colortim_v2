import pool from './pool';

const schema = `
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(200) NOT NULL,
  email VARCHAR(200),
  role VARCHAR(50) NOT NULL DEFAULT 'Operador',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  sector VARCHAR(100) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fibras (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transportadoras (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS regioes_entrega (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS production_sheets (
  id SERIAL PRIMARY KEY,
  sheet_number VARCHAR(50) UNIQUE NOT NULL,
  client VARCHAR(200) NOT NULL,
  color VARCHAR(200) NOT NULL,
  order_number VARCHAR(100),
  description TEXT,
  entry_date TIMESTAMPTZ NOT NULL,
  expected_date TIMESTAMPTZ NOT NULL,
  created_by_user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS production_orders (
  id SERIAL PRIMARY KEY,
  sheet_id INTEGER REFERENCES production_sheets(id),
  op_number VARCHAR(50) NOT NULL,
  client VARCHAR(200) NOT NULL,
  color VARCHAR(200) NOT NULL,
  order_number VARCHAR(100),
  entry_date TIMESTAMPTZ NOT NULL,
  expected_date TIMESTAMPTZ NOT NULL,
  material VARCHAR(200),
  quantity NUMERIC,
  unit VARCHAR(50),
  requires_lab BOOLEAN NOT NULL DEFAULT false,
  requires_fabric_quality BOOLEAN NOT NULL DEFAULT false,
  status VARCHAR(50) NOT NULL DEFAULT 'almoxarifado',
  current_stage VARCHAR(50) NOT NULL DEFAULT 'almoxarifado',
  responsible_user_id UUID REFERENCES users(id),
  description TEXT,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  priority INTEGER NOT NULL DEFAULT 0,
  priority_notes TEXT,
  sequence_order INTEGER,
  lot_number INTEGER,
  parent_op_id INTEGER REFERENCES production_orders(id),
  lot_meters NUMERIC,
  region_jaragua BOOLEAN NOT NULL DEFAULT false,
  region_brusque BOOLEAN NOT NULL DEFAULT false,
  region_gaspar BOOLEAN NOT NULL DEFAULT false,
  fiber_id INTEGER REFERENCES fibras(id),
  is_dual_fiber BOOLEAN NOT NULL DEFAULT false,
  fiber2_id INTEGER REFERENCES fibras(id),
  recipe_approved BOOLEAN NOT NULL DEFAULT false,
  recipe_weighed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_log (
  id SERIAL PRIMARY KEY,
  op_id INTEGER REFERENCES production_orders(id),
  stage VARCHAR(100),
  action VARCHAR(100),
  user_id UUID REFERENCES users(id),
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS po_preparation (
  id SERIAL PRIMARY KEY,
  op_id INTEGER REFERENCES production_orders(id),
  employee_ids JSONB,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  splices JSONB,
  total_weight NUMERIC,
  destination_box VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS preparation_batches (
  id SERIAL PRIMARY KEY,
  batch_number VARCHAR(50) UNIQUE NOT NULL,
  color VARCHAR(200),
  total_weight NUMERIC,
  destination_box VARCHAR(50),
  employee_ids JSONB,
  splices JSONB,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS batch_ops (
  id SERIAL PRIMARY KEY,
  batch_id INTEGER REFERENCES preparation_batches(id),
  op_id INTEGER REFERENCES production_orders(id),
  meters_in_batch NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS po_production (
  id SERIAL PRIMARY KEY,
  op_id INTEGER REFERENCES production_orders(id),
  box_number VARCHAR(50),
  machine VARCHAR(100),
  operator VARCHAR(200),
  has_adjustment BOOLEAN NOT NULL DEFAULT false,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  meters_produced NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS po_dryer (
  id SERIAL PRIMARY KEY,
  op_id INTEGER REFERENCES production_orders(id),
  destination VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS po_untangling (
  id SERIAL PRIMARY KEY,
  op_id INTEGER REFERENCES production_orders(id),
  num_employees INTEGER,
  meters_per_employee NUMERIC,
  employee_times JSONB,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS po_rolling (
  id SERIAL PRIMARY KEY,
  op_id INTEGER REFERENCES production_orders(id),
  employee_ids JSONB,
  num_splices INTEGER,
  num_rolls INTEGER,
  issue_description TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS po_quality (
  id SERIAL PRIMARY KEY,
  op_id INTEGER REFERENCES production_orders(id),
  rolls_sent INTEGER,
  meters_per_roll NUMERIC,
  discrepancy TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS po_laboratory (
  id SERIAL PRIMARY KEY,
  op_id INTEGER REFERENCES production_orders(id),
  num_batches INTEGER,
  is_recipe_ready BOOLEAN NOT NULL DEFAULT false,
  recipe_origin_date DATE,
  description TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS po_pesagem (
  id SERIAL PRIMARY KEY,
  op_id INTEGER REFERENCES production_orders(id),
  employee_id VARCHAR(200),
  notes TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS po_box4 (
  id SERIAL PRIMARY KEY,
  po_id INTEGER REFERENCES production_orders(id),
  employee_id VARCHAR(200),
  has_adjustment BOOLEAN NOT NULL DEFAULT false,
  adjustment_details TEXT,
  is_reprocess BOOLEAN NOT NULL DEFAULT false,
  reprocess_reason TEXT,
  timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS po_box5 (
  id SERIAL PRIMARY KEY,
  po_id INTEGER REFERENCES production_orders(id),
  employee_id VARCHAR(200),
  has_adjustment BOOLEAN NOT NULL DEFAULT false,
  adjustment_details TEXT,
  is_reprocess BOOLEAN NOT NULL DEFAULT false,
  reprocess_reason TEXT,
  timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS po_box6 (
  id SERIAL PRIMARY KEY,
  po_id INTEGER REFERENCES production_orders(id),
  employee_id VARCHAR(200),
  has_adjustment BOOLEAN NOT NULL DEFAULT false,
  adjustment_details TEXT,
  is_reprocess BOOLEAN NOT NULL DEFAULT false,
  reprocess_reason TEXT,
  timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS po_in_progress (
  id SERIAL PRIMARY KEY,
  op_id INTEGER REFERENCES production_orders(id),
  stage VARCHAR(100),
  box_number VARCHAR(50),
  machine VARCHAR(100),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lista_saida (
  id SERIAL PRIMARY KEY,
  op_id INTEGER REFERENCES production_orders(id),
  exit_date DATE NOT NULL,
  exit_time TIME,
  transportadora_id INTEGER REFERENCES transportadoras(id),
  regiao_id INTEGER REFERENCES regioes_entrega(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fabric_quality_inspections (
  id SERIAL PRIMARY KEY,
  inspection_number VARCHAR(50) UNIQUE NOT NULL,
  item_description TEXT NOT NULL,
  weight NUMERIC NOT NULL,
  destination_sector VARCHAR(100) NOT NULL,
  observations TEXT,
  defect_image_url TEXT,
  employee_name VARCHAR(200) NOT NULL,
  inspection_date DATE NOT NULL,
  priority VARCHAR(20) NOT NULL DEFAULT 'normal',
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Running migrations...');
    await client.query(schema);
    console.log('Migrations completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(() => process.exit(1));
