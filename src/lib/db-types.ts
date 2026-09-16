// Database types for Supabase schema
// Matches the schema defined in supabase/migrations/001_initial_schema.sql

export type CompaniesRow = {
  id: string
  name: string
  responsible_name: string | null
  phone: string | null
  business_type: string | null
  created_at: string
}

export type CompanyMembersRow = {
  company_id: string
  user_id: string
  role: string
  created_at: string
}

export type CustomersRow = {
  id: string
  company_id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  notes: string | null
  created_at: string
}

export type QuoteItemsRow = {
  id: string
  company_id: string
  quote_id: string
  description: string
  quantity: string
  unit_price_cents: number | string
  created_at: string
}

export type QuotesRow = {
  id: string
  company_id: string
  customer_id: string
  title: string
  description: string | null
  status: string
  total_amount_cents: number | string
  valid_until: string | null
  estimated_days: number | null
  notes: string | null
  created_at: string
}

export type JobsRow = {
  id: string
  company_id: string
  customer_id: string
  quote_id: string | null
  title: string
  description: string | null
  due_date: string | null
  status: string
  total_amount_cents: number | string
  created_at: string
}

export type JobMaterialsRow = {
  id: string
  company_id: string
  job_id: string
  material_id: string
  variant: string | null
  quantity: string
  created_at: string
}

export type MaterialsRow = {
  id: string
  company_id: string
  name: string
  unit: string
  current_quantity: string
  minimum_quantity: string | null
  notes: string | null
  created_at: string
}

export type MaterialVariantsRow = {
  id: string
  company_id: string
  material_id: string
  label: string
  created_at: string
}

export type StockMovementsRow = {
  id: string
  company_id: string
  material_id: string
  job_id: string | null
  variant: string | null
  quantity: string
  movement_type: string
  note: string | null
  created_at: string
}

export type ReceivablesRow = {
  id: string
  company_id: string
  job_id: string
  customer_id: string
  description: string
  amount_cents: number | string
  due_date: string
  status: string
  received_at: string | null
  created_at: string
}
