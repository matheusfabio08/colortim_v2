CREATE TABLE activity_log (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  op_id      UUID NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
  stage      VARCHAR(50) NOT NULL,
  action     VARCHAR(100) NOT NULL,
  user_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  details    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_activity_log_op_id ON activity_log(op_id);
CREATE INDEX idx_activity_log_created_at ON activity_log(created_at DESC);

CREATE TABLE po_in_progress (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  op_id      UUID NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
  stage      VARCHAR(50) NOT NULL,
  box_number VARCHAR(20),
  machine    VARCHAR(100),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(op_id, stage)
);
CREATE INDEX idx_po_in_progress_op_id ON po_in_progress(op_id);

CREATE TABLE po_preparation (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  op_id           UUID NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
  employee_ids    JSONB NOT NULL DEFAULT '[]',
  start_time      TIMESTAMPTZ,
  end_time        TIMESTAMPTZ,
  splices         JSONB NOT NULL DEFAULT '[]',
  total_weight    NUMERIC(12,3),
  destination_box VARCHAR(20),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_po_preparation_op_id ON po_preparation(op_id);

CREATE TABLE preparation_batches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_number    VARCHAR(20) NOT NULL,
  color           VARCHAR(255) NOT NULL,
  total_weight    NUMERIC(12,3),
  destination_box VARCHAR(20),
  employee_ids    JSONB NOT NULL DEFAULT '[]',
  splices         JSONB NOT NULL DEFAULT '[]',
  start_time      TIMESTAMPTZ,
  end_time        TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_batches_batch_number ON preparation_batches(batch_number);
CREATE TRIGGER trg_batches_updated_at BEFORE UPDATE ON preparation_batches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE batch_ops (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id        UUID NOT NULL REFERENCES preparation_batches(id) ON DELETE CASCADE,
  op_id           UUID NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
  meters_in_batch NUMERIC(12,3),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(batch_id, op_id)
);
CREATE INDEX idx_batch_ops_batch_id ON batch_ops(batch_id);
CREATE INDEX idx_batch_ops_op_id ON batch_ops(op_id);

CREATE TABLE po_production (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  op_id           UUID NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
  box_number      VARCHAR(20),
  machine         VARCHAR(100),
  operator        VARCHAR(255),
  has_adjustment  BOOLEAN NOT NULL DEFAULT FALSE,
  start_date      TIMESTAMPTZ,
  end_date        TIMESTAMPTZ,
  meters_produced NUMERIC(12,3),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_po_production_op_id ON po_production(op_id);

CREATE TABLE po_dryer (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  op_id       UUID NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
  destination VARCHAR(50),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_po_dryer_op_id ON po_dryer(op_id);

CREATE TABLE po_untangling (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  op_id               UUID NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
  num_employees       INTEGER,
  meters_per_employee NUMERIC(12,3),
  employee_times      JSONB NOT NULL DEFAULT '[]',
  start_time          TIMESTAMPTZ,
  end_time            TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_po_untangling_op_id ON po_untangling(op_id);

CREATE TABLE po_rolling (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  op_id             UUID NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
  employee_ids      JSONB NOT NULL DEFAULT '[]',
  num_splices       INTEGER,
  num_rolls         INTEGER,
  issue_description TEXT,
  start_time        TIMESTAMPTZ,
  end_time          TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_po_rolling_op_id ON po_rolling(op_id);

CREATE TABLE po_quality (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  op_id           UUID NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
  rolls_sent      INTEGER,
  meters_per_roll NUMERIC(12,3),
  discrepancy     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_po_quality_op_id ON po_quality(op_id);

CREATE TABLE po_laboratory (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  op_id            UUID NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
  num_batches      INTEGER,
  is_recipe_ready  BOOLEAN NOT NULL DEFAULT FALSE,
  recipe_origin_date DATE,
  description      TEXT,
  is_approved      BOOLEAN NOT NULL DEFAULT FALSE,
  start_time       TIMESTAMPTZ,
  end_time         TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_po_laboratory_op_id ON po_laboratory(op_id);

CREATE TABLE po_pesagem (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  op_id       UUID NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  notes       TEXT,
  start_time  TIMESTAMPTZ,
  end_time    TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_po_pesagem_op_id ON po_pesagem(op_id);
CREATE TRIGGER trg_pesagem_updated_at BEFORE UPDATE ON po_pesagem FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE po_box_processing (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  op_id              UUID NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
  box_number         VARCHAR(10) NOT NULL CHECK (box_number IN ('box4','box5','box6')),
  employee_id        VARCHAR(255) NOT NULL,
  has_adjustment     BOOLEAN NOT NULL DEFAULT FALSE,
  adjustment_details TEXT,
  is_reprocess       BOOLEAN NOT NULL DEFAULT FALSE,
  reprocess_reason   TEXT,
  processed_at       TIMESTAMPTZ NOT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_po_box_op_id ON po_box_processing(op_id);
CREATE INDEX idx_po_box_box_number ON po_box_processing(box_number);

CREATE TABLE lista_saida (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  op_id             UUID NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
  exit_date         DATE NOT NULL,
  exit_time         TIME,
  transportadora_id UUID REFERENCES transportadoras(id) ON DELETE SET NULL,
  regiao_id         UUID REFERENCES regioes_entrega(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(op_id)
);
CREATE INDEX idx_lista_saida_exit_date ON lista_saida(exit_date);
CREATE TRIGGER trg_lista_saida_updated_at BEFORE UPDATE ON lista_saida FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE fabric_quality_inspections (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_number VARCHAR(20) NOT NULL,
  item_description  TEXT NOT NULL,
  weight            NUMERIC(12,3) NOT NULL,
  destination_sector VARCHAR(100) NOT NULL,
  observations      TEXT,
  defect_image_url  TEXT,
  employee_name     VARCHAR(255) NOT NULL,
  inspection_date   DATE NOT NULL,
  priority          VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal','urgent')),
  status            VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_fqi_inspection_number ON fabric_quality_inspections(inspection_number);
CREATE INDEX idx_fqi_status ON fabric_quality_inspections(status);
CREATE INDEX idx_fqi_inspection_date ON fabric_quality_inspections(inspection_date DESC);
CREATE TRIGGER trg_fqi_updated_at BEFORE UPDATE ON fabric_quality_inspections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
