CREATE TABLE fibras (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(100) NOT NULL,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_fibras_name ON fibras(name);
CREATE TRIGGER trg_fibras_updated_at BEFORE UPDATE ON fibras FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE regioes_entrega (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(100) NOT NULL,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_regioes_name ON regioes_entrega(name);
CREATE TRIGGER trg_regioes_updated_at BEFORE UPDATE ON regioes_entrega FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE transportadoras (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(100) NOT NULL,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_transportadoras_name ON transportadoras(name);
CREATE TRIGGER trg_transportadoras_updated_at BEFORE UPDATE ON transportadoras FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE employees (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(255) NOT NULL,
  sector     VARCHAR(100) NOT NULL,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_employees_sector ON employees(sector);
CREATE INDEX idx_employees_is_active ON employees(is_active);
CREATE TRIGGER trg_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
