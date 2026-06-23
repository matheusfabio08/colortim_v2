CREATE TABLE production_sheets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_number  VARCHAR(20) NOT NULL,
  client        VARCHAR(255) NOT NULL,
  color         VARCHAR(255) NOT NULL,
  order_number  VARCHAR(100),
  description   TEXT,
  entry_date    DATE NOT NULL,
  expected_date DATE NOT NULL,
  created_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_sheets_sheet_number ON production_sheets(sheet_number);
CREATE INDEX idx_sheets_client ON production_sheets(client);
CREATE TRIGGER trg_sheets_updated_at BEFORE UPDATE ON production_sheets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TYPE po_status AS ENUM (
  'almoxarifado','qualidade_malhas','preparacao',
  'box4','box5','box6','producao','secadora',
  'destrinchagem','enrolagem','qualidade','concluido'
);

CREATE TABLE production_orders (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_id                UUID NOT NULL REFERENCES production_sheets(id) ON DELETE CASCADE,
  op_number               VARCHAR(30) NOT NULL,
  client                  VARCHAR(255) NOT NULL,
  color                   VARCHAR(255) NOT NULL,
  order_number            VARCHAR(100),
  entry_date              DATE NOT NULL,
  expected_date           DATE NOT NULL,
  material                VARCHAR(255),
  quantity                NUMERIC(12,3),
  unit                    VARCHAR(20),
  requires_lab            BOOLEAN NOT NULL DEFAULT FALSE,
  requires_fabric_quality BOOLEAN NOT NULL DEFAULT FALSE,
  status                  po_status NOT NULL DEFAULT 'almoxarifado',
  current_stage           VARCHAR(50) NOT NULL DEFAULT 'almoxarifado',
  is_completed            BOOLEAN NOT NULL DEFAULT FALSE,
  priority                SMALLINT NOT NULL DEFAULT 0,
  priority_notes          TEXT,
  sequence_order          INTEGER,
  description             TEXT,
  region_jaragua          BOOLEAN NOT NULL DEFAULT FALSE,
  region_brusque          BOOLEAN NOT NULL DEFAULT FALSE,
  region_gaspar           BOOLEAN NOT NULL DEFAULT FALSE,
  fiber_id                UUID REFERENCES fibras(id) ON DELETE SET NULL,
  is_dual_fiber           BOOLEAN NOT NULL DEFAULT FALSE,
  fiber2_id               UUID REFERENCES fibras(id) ON DELETE SET NULL,
  lot_number              INTEGER,
  parent_op_id            UUID REFERENCES production_orders(id) ON DELETE SET NULL,
  lot_meters              NUMERIC(12,3),
  recipe_approved         BOOLEAN NOT NULL DEFAULT FALSE,
  recipe_weighed          BOOLEAN NOT NULL DEFAULT FALSE,
  responsible_user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_po_op_number ON production_orders(op_number);
CREATE INDEX idx_po_sheet_id ON production_orders(sheet_id);
CREATE INDEX idx_po_status ON production_orders(status);
CREATE INDEX idx_po_is_completed ON production_orders(is_completed);
CREATE INDEX idx_po_expected_date ON production_orders(expected_date);
CREATE INDEX idx_po_client ON production_orders(client);
CREATE INDEX idx_po_color ON production_orders(color);
CREATE INDEX idx_po_requires_lab ON production_orders(requires_lab);
CREATE INDEX idx_po_parent_op_id ON production_orders(parent_op_id);
CREATE INDEX idx_po_created_at ON production_orders(created_at DESC);
CREATE TRIGGER trg_po_updated_at BEFORE UPDATE ON production_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
