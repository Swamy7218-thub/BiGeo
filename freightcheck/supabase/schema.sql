-- FreightCheck — Supabase PostgreSQL Schema
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ── Tables ────────────────────────────────────────────────────────────────

CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  industry TEXT,
  plan TEXT NOT NULL DEFAULT 'pilot',
  email_domain TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'clerk' CHECK (role IN ('clerk','finance_head','admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE transporters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  gstin TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE rate_contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transporter_id UUID NOT NULL REFERENCES transporters(id) ON DELETE CASCADE,
  raw_file_url TEXT NOT NULL,
  parsed_json JSONB,
  valid_from DATE NOT NULL,
  valid_to DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','confirmed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE rate_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID NOT NULL REFERENCES rate_contracts(id) ON DELETE CASCADE,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  vehicle_type TEXT NOT NULL,
  rate NUMERIC(12,2) NOT NULL,
  rate_basis TEXT NOT NULL DEFAULT 'per_trip' CHECK (rate_basis IN ('per_trip','per_km','per_ton')),
  detention_free_days INT NOT NULL DEFAULT 1,
  detention_rate NUMERIC(10,2) NOT NULL DEFAULT 0
);

CREATE TABLE bills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transporter_id UUID NOT NULL REFERENCES transporters(id),
  bill_number TEXT NOT NULL,
  bill_date DATE NOT NULL,
  raw_file_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing','ready','reviewed')),
  total_claimed NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_approved NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_flagged NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE trip_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  lr_number TEXT NOT NULL,
  trip_date DATE NOT NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  vehicle_number TEXT NOT NULL,
  vehicle_type TEXT NOT NULL,
  base_amount NUMERIC(12,2) NOT NULL,
  extra_charges_json JSONB NOT NULL DEFAULT '{}',
  extraction_confidence NUMERIC(4,3) NOT NULL DEFAULT 1.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_line_id UUID NOT NULL REFERENCES trip_lines(id) ON DELETE CASCADE,
  flag_type TEXT NOT NULL CHECK (flag_type IN ('rate_mismatch','duplicate','detention_invalid','missing_pod','unknown_lane')),
  expected_amount NUMERIC(12,2),
  claimed_amount NUMERIC(12,2),
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','accepted','waived','disputed')),
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE pods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_line_id UUID REFERENCES trip_lines(id),
  file_url TEXT NOT NULL,
  extracted_lr_number TEXT,
  matched_by TEXT CHECK (matched_by IN ('auto','manual')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id),
  actor_id UUID REFERENCES users(id),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  before_state JSONB,
  after_state JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────────────────
CREATE INDEX idx_users_company ON users(company_id);
CREATE INDEX idx_transporters_company ON transporters(company_id);
CREATE INDEX idx_rate_contracts_transporter ON rate_contracts(transporter_id);
CREATE INDEX idx_rate_lines_contract ON rate_lines(contract_id);
CREATE INDEX idx_bills_transporter ON bills(transporter_id);
CREATE INDEX idx_bills_status ON bills(status);
CREATE INDEX idx_bills_created ON bills(created_at DESC);
CREATE INDEX idx_trip_lines_bill ON trip_lines(bill_id);
CREATE INDEX idx_trip_lines_lr ON trip_lines(lr_number);
CREATE INDEX idx_trip_lines_low_confidence ON trip_lines(extraction_confidence) WHERE extraction_confidence < 0.85;
CREATE INDEX idx_flags_trip_line ON flags(trip_line_id);
CREATE INDEX idx_flags_status ON flags(status);
CREATE INDEX idx_flags_type ON flags(flag_type);
CREATE INDEX idx_pods_trip_line ON pods(trip_line_id);
CREATE INDEX idx_audit_log_company ON audit_log(company_id, created_at DESC);
CREATE INDEX idx_trip_lines_origin_trgm ON trip_lines USING GIN (origin gin_trgm_ops);
CREATE INDEX idx_trip_lines_dest_trgm ON trip_lines USING GIN (destination gin_trgm_ops);
CREATE INDEX idx_trip_lines_lr_trgm ON trip_lines USING GIN (lr_number gin_trgm_ops);

-- ── updated_at trigger ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_companies_updated BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_transporters_updated BEFORE UPDATE ON transporters FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_rate_contracts_updated BEFORE UPDATE ON rate_contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_bills_updated BEFORE UPDATE ON bills FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Bill totals recalculation trigger ────────────────────────────────────
CREATE OR REPLACE FUNCTION recalculate_bill_totals()
RETURNS TRIGGER AS $$
DECLARE
  v_bill_id UUID;
  v_total_claimed NUMERIC := 0;
  v_total_flagged NUMERIC := 0;
BEGIN
  IF TG_OP = 'DELETE' THEN
    SELECT bill_id INTO v_bill_id FROM trip_lines WHERE id = OLD.trip_line_id;
  ELSE
    SELECT bill_id INTO v_bill_id FROM trip_lines WHERE id = NEW.trip_line_id;
  END IF;

  SELECT
    COALESCE(SUM(
      tl.base_amount
      + COALESCE((tl.extra_charges_json->>'detention')::NUMERIC, 0)
      + COALESCE((tl.extra_charges_json->>'loading')::NUMERIC, 0)
      + COALESCE((tl.extra_charges_json->>'toll')::NUMERIC, 0)
      + COALESCE((tl.extra_charges_json->>'other')::NUMERIC, 0)
    ), 0),
    COALESCE(SUM(
      CASE WHEN f.status IN ('open','disputed')
        THEN GREATEST(COALESCE(f.claimed_amount,0) - COALESCE(f.expected_amount,0), 0)
        ELSE 0
      END
    ), 0)
  INTO v_total_claimed, v_total_flagged
  FROM trip_lines tl
  LEFT JOIN flags f ON f.trip_line_id = tl.id
  WHERE tl.bill_id = v_bill_id;

  UPDATE bills SET
    total_claimed  = v_total_claimed,
    total_flagged  = v_total_flagged,
    total_approved = v_total_claimed - v_total_flagged
  WHERE id = v_bill_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_flag_bill_totals
AFTER INSERT OR UPDATE OR DELETE ON flags
FOR EACH ROW EXECUTE FUNCTION recalculate_bill_totals();

-- ── Audit log trigger on flag changes ────────────────────────────────────
CREATE OR REPLACE FUNCTION log_flag_change()
RETURNS TRIGGER AS $$
DECLARE v_company_id UUID;
BEGIN
  SELECT t.company_id INTO v_company_id
  FROM trip_lines tl
  JOIN bills b ON b.id = tl.bill_id
  JOIN transporters t ON t.id = b.transporter_id
  WHERE tl.id = NEW.trip_line_id
  LIMIT 1;

  INSERT INTO audit_log (company_id, actor_id, entity_type, entity_id, action, before_state, after_state)
  VALUES (
    v_company_id,
    NEW.updated_by,
    'flag',
    NEW.id,
    CASE WHEN TG_OP = 'INSERT' THEN 'created' ELSE 'status_changed' END,
    CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
    to_jsonb(NEW)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_flag_audit
AFTER INSERT OR UPDATE ON flags
FOR EACH ROW EXECUTE FUNCTION log_flag_change();

-- ── Row Level Security ────────────────────────────────────────────────────
ALTER TABLE companies     ENABLE ROW LEVEL SECURITY;
ALTER TABLE users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE transporters  ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_lines    ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills         ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_lines    ENABLE ROW LEVEL SECURITY;
ALTER TABLE flags         ENABLE ROW LEVEL SECURITY;
ALTER TABLE pods          ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log     ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION current_company_id() RETURNS UUID AS $$
  SELECT company_id FROM users WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE POLICY companies_own      ON companies      FOR ALL USING (id = current_company_id());
CREATE POLICY users_own          ON users          FOR ALL USING (company_id = current_company_id());
CREATE POLICY transporters_own   ON transporters   FOR ALL USING (company_id = current_company_id());
CREATE POLICY rate_contracts_own ON rate_contracts FOR ALL USING (transporter_id IN (SELECT id FROM transporters WHERE company_id = current_company_id()));
CREATE POLICY rate_lines_own     ON rate_lines     FOR ALL USING (contract_id IN (SELECT rc.id FROM rate_contracts rc JOIN transporters t ON t.id = rc.transporter_id WHERE t.company_id = current_company_id()));
CREATE POLICY bills_own          ON bills          FOR ALL USING (transporter_id IN (SELECT id FROM transporters WHERE company_id = current_company_id()));
CREATE POLICY trip_lines_own     ON trip_lines     FOR ALL USING (bill_id IN (SELECT b.id FROM bills b JOIN transporters t ON t.id = b.transporter_id WHERE t.company_id = current_company_id()));
CREATE POLICY flags_own          ON flags          FOR ALL USING (trip_line_id IN (SELECT tl.id FROM trip_lines tl JOIN bills b ON b.id = tl.bill_id JOIN transporters t ON t.id = b.transporter_id WHERE t.company_id = current_company_id()));
CREATE POLICY pods_own           ON pods           FOR ALL USING (trip_line_id IS NULL OR trip_line_id IN (SELECT tl.id FROM trip_lines tl JOIN bills b ON b.id = tl.bill_id JOIN transporters t ON t.id = b.transporter_id WHERE t.company_id = current_company_id()));
CREATE POLICY audit_log_own      ON audit_log      FOR SELECT USING (company_id = current_company_id());
