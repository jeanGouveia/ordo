-- Enable RLS
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Companies table
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  responsible_name TEXT,
  phone TEXT,
  business_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Company members table (multi-tenancy)
CREATE TABLE company_members (
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (company_id, user_id)
);

-- Indexes for company_members
CREATE INDEX idx_company_members_user_id ON company_members(user_id);
CREATE INDEX idx_company_members_company_id ON company_members(company_id);

-- Customers table
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customers_company_id ON customers(company_id);

-- Quotes table
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'approved', 'rejected', 'cancelled')),
  total_amount_cents BIGINT NOT NULL DEFAULT 0,
  valid_until TIMESTAMPTZ,
  estimated_days INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_quotes_company_id ON quotes(company_id);
CREATE INDEX idx_quotes_customer_id ON quotes(customer_id);
CREATE INDEX idx_quotes_status ON quotes(status);

-- Quote items table
CREATE TABLE quote_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity TEXT NOT NULL,
  unit_price_cents BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_quote_items_company_id ON quote_items(company_id);
CREATE INDEX idx_quote_items_quote_id ON quote_items(quote_id);

-- Materials table (must be before job_materials)
CREATE TABLE materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  current_quantity TEXT NOT NULL DEFAULT '0',
  minimum_quantity TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_materials_company_id ON materials(company_id);

-- Material variants table
CREATE TABLE material_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_material_variants_company_id ON material_variants(company_id);
CREATE INDEX idx_material_variants_material_id ON material_variants(material_id);

-- Jobs table (with quote_id)
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_progress', 'ready', 'delivery_scheduled', 'completed', 'cancelled')),
  total_amount_cents BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_quote_id UNIQUE (quote_id)
);

CREATE INDEX idx_jobs_company_id ON jobs(company_id);
CREATE INDEX idx_jobs_customer_id ON jobs(customer_id);
CREATE INDEX idx_jobs_quote_id ON jobs(quote_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_due_date ON jobs(due_date);

-- Job materials table (must be after materials and jobs)
CREATE TABLE job_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  variant TEXT,
  quantity TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_job_materials_company_id ON job_materials(company_id);
CREATE INDEX idx_job_materials_job_id ON job_materials(job_id);
CREATE INDEX idx_job_materials_material_id ON job_materials(material_id);

-- Stock movements table
CREATE TABLE stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  variant TEXT,
  quantity TEXT NOT NULL,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('in', 'out')),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stock_movements_company_id ON stock_movements(company_id);
CREATE INDEX idx_stock_movements_material_id ON stock_movements(material_id);
CREATE INDEX idx_stock_movements_job_id ON stock_movements(job_id);

-- Receivables table
CREATE TABLE receivables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount_cents BIGINT NOT NULL DEFAULT 0,
  due_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'received', 'cancelled')),
  received_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_receivables_company_id ON receivables(company_id);
CREATE INDEX idx_receivables_job_id ON receivables(job_id);
CREATE INDEX idx_receivables_customer_id ON receivables(customer_id);
CREATE INDEX idx_receivables_status ON receivables(status);
CREATE INDEX idx_receivables_due_date ON receivables(due_date);

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE receivables ENABLE ROW LEVEL SECURITY;

-- RLS Policies for company_members
-- Users can see their own company memberships
CREATE POLICY "Users can view own company memberships"
  ON company_members FOR SELECT
  USING (auth.uid() = user_id);

-- No INSERT policy - membership created only via RPC
-- No UPDATE policy - roles managed only via RPC
-- No DELETE policy - membership removal managed only via RPC

-- RLS Policies for companies
-- Users can view companies they are members of
CREATE POLICY "Users can view member companies"
  ON companies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE company_members.company_id = companies.id
      AND company_members.user_id = auth.uid()
    )
  );

-- Users can insert companies (will be paired with company_members via RPC)
CREATE POLICY "Users can insert companies"
  ON companies FOR INSERT
  WITH CHECK (true);

-- Owners can update their companies
CREATE POLICY "Owners can update companies"
  ON companies FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE company_members.company_id = companies.id
      AND company_members.user_id = auth.uid()
      AND company_members.role = 'owner'
    )
  );

-- Owners can delete their companies
CREATE POLICY "Owners can delete companies"
  ON companies FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE company_members.company_id = companies.id
      AND company_members.user_id = auth.uid()
      AND company_members.role = 'owner'
    )
  );

-- RLS Policies for customers
CREATE POLICY "Users can view customers of member companies"
  ON customers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE company_members.company_id = customers.company_id
      AND company_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert customers for member companies"
  ON customers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE company_members.company_id = customers.company_id
      AND company_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update customers of member companies"
  ON customers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE company_members.company_id = customers.company_id
      AND company_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete customers of member companies"
  ON customers FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE company_members.company_id = customers.company_id
      AND company_members.user_id = auth.uid()
    )
  );

-- RLS Policies for quotes
CREATE POLICY "Users can view quotes of member companies"
  ON quotes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE company_members.company_id = quotes.company_id
      AND company_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert quotes for member companies"
  ON quotes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE company_members.company_id = quotes.company_id
      AND company_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update quotes of member companies"
  ON quotes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE company_members.company_id = quotes.company_id
      AND company_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete quotes of member companies"
  ON quotes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE company_members.company_id = quotes.company_id
      AND company_members.user_id = auth.uid()
    )
  );

-- RLS Policies for quote_items
CREATE POLICY "Users can view quote_items of member companies"
  ON quote_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE company_members.company_id = quote_items.company_id
      AND company_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert quote_items for member companies"
  ON quote_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE company_members.company_id = quote_items.company_id
      AND company_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update quote_items of member companies"
  ON quote_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE company_members.company_id = quote_items.company_id
      AND company_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete quote_items of member companies"
  ON quote_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE company_members.company_id = quote_items.company_id
      AND company_members.user_id = auth.uid()
    )
  );

-- RLS Policies for jobs
CREATE POLICY "Users can view jobs of member companies"
  ON jobs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE company_members.company_id = jobs.company_id
      AND company_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert jobs for member companies"
  ON jobs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE company_members.company_id = jobs.company_id
      AND company_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update jobs of member companies"
  ON jobs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE company_members.company_id = jobs.company_id
      AND company_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete jobs of member companies"
  ON jobs FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE company_members.company_id = jobs.company_id
      AND company_members.user_id = auth.uid()
    )
  );

-- RLS Policies for job_materials
CREATE POLICY "Users can view job_materials of member companies"
  ON job_materials FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE company_members.company_id = job_materials.company_id
      AND company_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert job_materials for member companies"
  ON job_materials FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE company_members.company_id = job_materials.company_id
      AND company_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update job_materials of member companies"
  ON job_materials FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE company_members.company_id = job_materials.company_id
      AND company_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete job_materials of member companies"
  ON job_materials FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE company_members.company_id = job_materials.company_id
      AND company_members.user_id = auth.uid()
    )
  );

-- RLS Policies for materials
CREATE POLICY "Users can view materials of member companies"
  ON materials FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE company_members.company_id = materials.company_id
      AND company_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert materials for member companies"
  ON materials FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE company_members.company_id = materials.company_id
      AND company_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update materials of member companies"
  ON materials FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE company_members.company_id = materials.company_id
      AND company_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete materials of member companies"
  ON materials FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE company_members.company_id = materials.company_id
      AND company_members.user_id = auth.uid()
    )
  );

-- RLS Policies for material_variants
CREATE POLICY "Users can view material_variants of member companies"
  ON material_variants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE company_members.company_id = material_variants.company_id
      AND company_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert material_variants for member companies"
  ON material_variants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE company_members.company_id = material_variants.company_id
      AND company_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update material_variants of member companies"
  ON material_variants FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE company_members.company_id = material_variants.company_id
      AND company_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete material_variants of member companies"
  ON material_variants FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE company_members.company_id = material_variants.company_id
      AND company_members.user_id = auth.uid()
    )
  );

-- RLS Policies for stock_movements
CREATE POLICY "Users can view stock_movements of member companies"
  ON stock_movements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE company_members.company_id = stock_movements.company_id
      AND company_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert stock_movements for member companies"
  ON stock_movements FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE company_members.company_id = stock_movements.company_id
      AND company_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update stock_movements of member companies"
  ON stock_movements FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE company_members.company_id = stock_movements.company_id
      AND company_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete stock_movements of member companies"
  ON stock_movements FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE company_members.company_id = stock_movements.company_id
      AND company_members.user_id = auth.uid()
    )
  );

-- RLS Policies for receivables
CREATE POLICY "Users can view receivables of member companies"
  ON receivables FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE company_members.company_id = receivables.company_id
      AND company_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert receivables for member companies"
  ON receivables FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE company_members.company_id = receivables.company_id
      AND company_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update receivables of member companies"
  ON receivables FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE company_members.company_id = receivables.company_id
      AND company_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete receivables of member companies"
  ON receivables FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE company_members.company_id = receivables.company_id
      AND company_members.user_id = auth.uid()
    )
  );

-- RPC function to create company and membership atomically
CREATE OR REPLACE FUNCTION create_company_with_membership(
  p_name TEXT,
  p_responsible_name TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_business_type TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id UUID;
  v_user_id UUID;
BEGIN
  -- Validate user is authenticated
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Create company
  INSERT INTO companies (name, responsible_name, phone, business_type)
  VALUES (p_name, p_responsible_name, p_phone, p_business_type)
  RETURNING id INTO v_company_id;
  
  -- Create membership for current user
  INSERT INTO company_members (company_id, user_id, role)
  VALUES (v_company_id, v_user_id, 'owner');
  
  RETURN v_company_id;
END;
$$;

-- Grant execute on the function to authenticated users
GRANT EXECUTE ON FUNCTION create_company_with_membership TO authenticated;

-- RPC function to approve quote and create job atomically
CREATE OR REPLACE FUNCTION approve_quote_and_create_job(p_quote_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_quote RECORD;
  v_job_id UUID;
  v_result JSON;
BEGIN
  -- Validate user is authenticated
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Get quote and validate user access
  SELECT * INTO v_quote
  FROM quotes
  WHERE id = p_quote_id
  AND EXISTS (
    SELECT 1 FROM company_members
    WHERE company_members.company_id = quotes.company_id
    AND company_members.user_id = v_user_id
  );

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quote not found or access denied';
  END IF;

  -- Validate quote status
  IF v_quote.status NOT IN ('draft', 'sent') THEN
    RAISE EXCEPTION 'Quote can only be approved from draft or sent status';
  END IF;

  -- Check if job already exists (idempotency)
  SELECT id INTO v_job_id
  FROM jobs
  WHERE quote_id = p_quote_id;

  IF v_job_id IS NOT NULL THEN
    -- Job already exists, return it
    SELECT json_build_object(
      'job_id', v_job_id,
      'already_existed', true
    ) INTO v_result;
    RETURN v_result;
  END IF;

  -- Update quote status to approved
  UPDATE quotes
  SET status = 'approved'
  WHERE id = p_quote_id;

  -- Create job
  INSERT INTO jobs (
    company_id,
    customer_id,
    quote_id,
    title,
    description,
    due_date,
    status,
    total_amount_cents
  )
  VALUES (
    v_quote.company_id,
    v_quote.customer_id,
    v_quote.id,
    v_quote.title,
    v_quote.description,
    NULL,
    'waiting',
    v_quote.total_amount_cents
  )
  RETURNING id INTO v_job_id;

  -- Return created job
  SELECT json_build_object(
    'job_id', v_job_id,
    'already_existed', false
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Grant execute on the function to authenticated users
GRANT EXECUTE ON FUNCTION approve_quote_and_create_job TO authenticated;
