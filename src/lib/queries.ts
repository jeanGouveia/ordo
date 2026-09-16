import { supabase } from '@/lib/supabase/client'
import type { 
  CustomersRow, 
  QuotesRow, 
  QuoteItemsRow,
  JobsRow,
  MaterialsRow,
  MaterialVariantsRow,
  JobMaterialsRow,
  StockMovementsRow,
  ReceivablesRow,
  CompaniesRow 
} from '@/lib/db-types'

export async function getCompanyByUserId(userId: string): Promise<CompaniesRow | null> {
  try {
    const { data, error } = await supabase
      .from('company_members')
      .select('companies(*)')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching company:', error)
      return null
    }

    return (data?.companies as CompaniesRow[])[0] || null
  } catch (error) {
    console.error('Error fetching company:', error)
    return null
  }
}

export async function createCompany(data: Omit<CompaniesRow, 'id' | 'created_at'>, userId: string): Promise<CompaniesRow> {
  const result = await supabase.rpc('create_company_with_membership', {
    p_name: data.name,
    p_responsible_name: data.responsible_name,
    p_phone: data.phone,
    p_business_type: data.business_type,
  })

  if (result.error) {
    throw new Error('Failed to create company: ' + result.error.message)
  }

  // Fetch the created company
  const { data: company, error: fetchError } = await supabase
    .from('companies')
    .select('*')
    .eq('id', result.data)
    .single()

  if (fetchError) {
    throw new Error('Failed to fetch created company: ' + fetchError.message)
  }

  return company as CompaniesRow
}

export async function getCustomers(companyId: string): Promise<CustomersRow[]> {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching customers:', error)
      return []
    }

    return data as CustomersRow[] || []
  } catch (error) {
    console.error('Error fetching customers:', error)
    return []
  }
}

export async function getCustomerById(id: string, companyId: string): Promise<CustomersRow | null> {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .eq('company_id', companyId)
      .single()

    if (error) {
      console.error('Error fetching customer:', error)
      return null
    }

    return data as CustomersRow || null
  } catch (error) {
    console.error('Error fetching customer:', error)
    return null
  }
}

export async function searchCustomers(companyId: string, query: string): Promise<CustomersRow[]> {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('company_id', companyId)
      .ilike('name', `%${query}%`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error searching customers:', error)
      return []
    }

    return data as CustomersRow[] || []
  } catch (error) {
    console.error('Error searching customers:', error)
    return []
  }
}

export async function getQuotes(companyId: string): Promise<QuotesRow[]> {
  try {
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching quotes:', error)
      return []
    }

    return data as QuotesRow[] || []
  } catch (error) {
    console.error('Error fetching quotes:', error)
    return []
  }
}

export async function getQuoteById(id: string, companyId: string): Promise<QuotesRow | null> {
  try {
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', id)
      .eq('company_id', companyId)
      .single()

    if (error) {
      console.error('Error fetching quote:', error)
      return null
    }

    return data as QuotesRow || null
  } catch (error) {
    console.error('Error fetching quote:', error)
    return null
  }
}

export async function getQuoteItems(quoteId: string, companyId: string): Promise<QuoteItemsRow[]> {
  try {
    const { data, error } = await supabase
      .from('quote_items')
      .select('*')
      .eq('quote_id', quoteId)
      .eq('company_id', companyId)

    if (error) {
      console.error('Error fetching quote items:', error)
      return []
    }

    return data as QuoteItemsRow[] || []
  } catch (error) {
    console.error('Error fetching quote items:', error)
    return []
  }
}

export async function getJobs(companyId: string): Promise<JobsRow[]> {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching jobs:', error)
      return []
    }

    return data as JobsRow[] || []
  } catch (error) {
    console.error('Error fetching jobs:', error)
    return []
  }
}

export async function getJobById(id: string, companyId: string): Promise<JobsRow | null> {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .eq('company_id', companyId)
      .single()

    if (error) {
      console.error('Error fetching job:', error)
      return null
    }

    return data as JobsRow || null
  } catch (error) {
    console.error('Error fetching job:', error)
    return null
  }
}

export async function getJobMaterials(jobId: string, companyId: string): Promise<JobMaterialsRow[]> {
  try {
    const { data, error } = await supabase
      .from('job_materials')
      .select('*')
      .eq('job_id', jobId)
      .eq('company_id', companyId)

    if (error) {
      console.error('Error fetching job materials:', error)
      return []
    }

    return data as JobMaterialsRow[] || []
  } catch (error) {
    console.error('Error fetching job materials:', error)
    return []
  }
}

export async function getMaterials(companyId: string): Promise<MaterialsRow[]> {
  try {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .eq('company_id', companyId)
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching materials:', error)
      return []
    }

    return data as MaterialsRow[] || []
  } catch (error) {
    console.error('Error fetching materials:', error)
    return []
  }
}

export async function getMaterialById(id: string, companyId: string): Promise<MaterialsRow | null> {
  try {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .eq('id', id)
      .eq('company_id', companyId)
      .single()

    if (error) {
      console.error('Error fetching material:', error)
      return null
    }

    return data as MaterialsRow || null
  } catch (error) {
    console.error('Error fetching material:', error)
    return null
  }
}

export async function getMaterialVariants(companyId: string): Promise<MaterialVariantsRow[]> {
  try {
    const { data, error } = await supabase
      .from('material_variants')
      .select('*')
      .eq('company_id', companyId)

    if (error) {
      console.error('Error fetching material variants:', error)
      return []
    }

    return data as MaterialVariantsRow[] || []
  } catch (error) {
    console.error('Error fetching material variants:', error)
    return []
  }
}

export async function getStockMovements(companyId: string, materialId?: string): Promise<StockMovementsRow[]> {
  try {
    let query = supabase
      .from('stock_movements')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    if (materialId) {
      query = query.eq('material_id', materialId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching stock movements:', error)
      return []
    }

    return data as StockMovementsRow[] || []
  } catch (error) {
    console.error('Error fetching stock movements:', error)
    return []
  }
}

export async function getReceivables(companyId: string): Promise<ReceivablesRow[]> {
  try {
    const { data, error } = await supabase
      .from('receivables')
      .select('*')
      .eq('company_id', companyId)
      .order('due_date', { ascending: true })

    if (error) {
      console.error('Error fetching receivables:', error)
      return []
    }

    return data as ReceivablesRow[] || []
  } catch (error) {
    console.error('Error fetching receivables:', error)
    return []
  }
}

export async function getReceivablesByStatus(companyId: string, status: string): Promise<ReceivablesRow[]> {
  try {
    const { data, error } = await supabase
      .from('receivables')
      .select('*')
      .eq('company_id', companyId)
      .eq('status', status)
      .order('due_date', { ascending: true })

    if (error) {
      console.error('Error fetching receivables by status:', error)
      return []
    }

    return data as ReceivablesRow[] || []
  } catch (error) {
    console.error('Error fetching receivables by status:', error)
    return []
  }
}
