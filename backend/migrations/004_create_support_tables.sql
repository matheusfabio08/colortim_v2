CREATE TABLE employees (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(200) NOT NULL,
  sector     VARCHAR(100) NOT NULL,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_employees_sector ON employees(sector);
CREATE INDEX idx_employees_is_active ON employees(is_active);

CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE regioes_entrega (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name      VARCHAR(200) NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE transportadoras (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name      VARCHAR(200) NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE lista_saida (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  op_id             UUID NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
  exit_date         DATE NOT NULL,
  exit_time         TIME,
  transportadora_id UUID REFERENCES transportadoras(id) ON DELETE SET NULL,
  regiao_id         UUID REFERENCES regioes_entrega(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(op_id)
);
CREATE INDEX idx_lista_saida_exit_date ON lista_saida(exit_date);

CREATE TABLE fabric_quality_inspections (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_number  VARCHAR(50) NOT NULL UNIQUE,
  item_description   TEXT NOT NULL,
  weight             NUMERIC(12,2) NOT NULL,
  destination_sector VARCHAR(200) NOT NULL,
  observations       TEXT,
  defect_image_url   TEXT,
  employee_name      VARCHAR(200) NOT NULL,
  inspection_date    DATE NOT NULL,
  priority           VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal','urgent')),
  status             VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed')),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_fabric_quality_inspections_updated_at
  BEFORE UPDATE ON fabric_quality_inspections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
