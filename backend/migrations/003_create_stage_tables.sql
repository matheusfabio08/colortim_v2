CREATE TABLE activity_log (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  op_id      UUID NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
  stage      VARCHAR(100) NOT NULL,
  action     VARCHAR(100) NOT NULL,
  user_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  details    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_activity_log_op_id ON activity_log(op_id);
CREATE INDEX idx_activity_log_stage ON activity_log(stage);
CREATE INDEX idx_activity_log_created_at ON activity_log(created_at DESC);

CREATE TABLE po_in_progress (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  op_id    UUID NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
  stage    VARCHAR(100) NOT NULL,
  UNIQUE (op_id, stage)
);

CREATE TABLE po_preparation (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  op_id       UUID NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  machine     VARCHAR(100),
  start_time  TIMESTAMPTZ,
  end_time    TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE preparation_batches (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_number     VARCHAR(50) NOT NULL UNIQUE,
  color            VARCHAR(200) NOT NULL,
  total_weight     NUMERIC(12,2),
  destination_box  VARCHAR(20),
  employee_ids     JSONB NOT NULL DEFAULT '[]',
  splices          JSONB NOT NULL DEFAULT '[]',
  start_time       VARCHAR(20),
  end_time         VARCHAR(20),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE po_box_processing (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  op_id               UUID NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
  box_number          VARCHAR(20) NOT NULL,
  employee_id         UUID REFERENCES employees(id) ON DELETE SET NULL,
  has_adjustment      BOOLEAN NOT NULL DEFAULT FALSE,
  adjustment_details  TEXT,
  is_reprocess        BOOLEAN NOT NULL DEFAULT FALSE,
  reprocess_reason    TEXT,
  processed_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_po_box_op_id ON po_box_processing(op_id);

CREATE TABLE po_laboratory (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  op_id               UUID NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
  num_batches         INTEGER,
  is_recipe_ready     BOOLEAN NOT NULL DEFAULT FALSE,
  recipe_origin_date  DATE,
  description         TEXT,
  is_approved         BOOLEAN NOT NULL DEFAULT FALSE,
  start_time          TIMESTAMPTZ,
  end_time            TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE po_production (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  op_id        UUID NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
  employee_id  UUID REFERENCES employees(id) ON DELETE SET NULL,
  machine_used VARCHAR(100),
  start_time   TIMESTAMPTZ,
  end_time     TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE po_dryer (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  op_id         UUID NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
  employee_id   UUID REFERENCES employees(id) ON DELETE SET NULL,
  temperature   NUMERIC(6,1),
  duration_min  INTEGER,
  start_time    TIMESTAMPTZ,
  end_time      TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE po_untangling (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  op_id        UUID NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
  employee_id  UUID REFERENCES employees(id) ON DELETE SET NULL,
  start_time   TIMESTAMPTZ,
  end_time     TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE po_rolling (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  op_id        UUID NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
  employee_id  UUID REFERENCES employees(id) ON DELETE SET NULL,
  start_time   TIMESTAMPTZ,
  end_time     TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE po_quality (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  op_id        UUID NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
  employee_id  UUID REFERENCES employees(id) ON DELETE SET NULL,
  is_approved  BOOLEAN NOT NULL DEFAULT FALSE,
  notes        TEXT,
  start_time   TIMESTAMPTZ,
  end_time     TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE po_pesagem (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  op_id        UUID NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
  employee_id  UUID REFERENCES employees(id) ON DELETE SET NULL,
  notes        TEXT,
  start_time   TIMESTAMPTZ,
  end_time     TIMESTAMPTZ,
  UNIQUE(op_id)
);
