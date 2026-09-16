import { supabase } from '@/lib/supabase/client'
import type { 
  CustomerInput, 
  QuoteInput, 
  QuoteItemInput,
  JobInput,
  MaterialInput,
  MaterialVariantInput,
  JobMaterialInput,
  StockMovementInput,
  ReceivableInput,
  CompanyInput 
} from '@/lib/schemas'

export async function createCustomer(data: CustomerInput, companyId: string) {
  const { data: customer, error } = await supabase
    .from('customers')
    .insert({
      ...data,
      company_id: companyId,
    })
    .select()
    .single()

  if (error) {
    throw new Error('Failed to create customer: ' + error.message)
  }

  return customer
}

export async function updateCustomer(id: string, data: Partial<CustomerInput>, companyId: string) {
  const { data: customer, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .eq('company_id', companyId)
    .single()

  if (error || !customer) {
    throw new Error('Customer not found or does not belong to this company')
  }

  const { data: updated, error: updateError } = await supabase
    .from('customers')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (updateError) {
    throw new Error('Failed to update customer: ' + updateError.message)
  }

  return updated
}

export async function deleteCustomer(id: string, companyId: string) {
  const { data: customer, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .eq('company_id', companyId)
    .single()

  if (error || !customer) {
    throw new Error('Customer not found or does not belong to this company')
  }

  const { error: deleteError } = await supabase
    .from('customers')
    .delete()
    .eq('id', id)

  if (deleteError) {
    throw new Error('Failed to delete customer: ' + deleteError.message)
  }
}

export async function createQuote(data: QuoteInput, companyId: string) {
  const { items, ...quoteData } = data

  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('*')
    .eq('id', quoteData.customerId)
    .eq('company_id', companyId)
    .single()

  if (customerError || !customer) {
    throw new Error('Customer not found or does not belong to this company')
  }

  const totalAmountCents = items.reduce(
    (sum, item) => sum + (item.quantity * item.unitPriceCents),
    0
  )

  const { data: quote, error: quoteError } = await supabase
    .from('quotes')
    .insert({
      ...quoteData,
      company_id: companyId,
      total_amount_cents: totalAmountCents,
    })
    .select()
    .single()

  if (quoteError) {
    throw new Error('Failed to create quote: ' + quoteError.message)
  }

  for (const item of items) {
    const { error: itemError } = await supabase
      .from('quote_items')
      .insert({
        ...item,
        company_id: companyId,
        quote_id: quote.id,
      })

    if (itemError) {
      throw new Error('Failed to create quote item: ' + itemError.message)
    }
  }

  return quote
}

export async function updateQuote(id: string, data: Partial<QuoteInput>, companyId: string) {
  const { data: existing, error: existingError } = await supabase
    .from('quotes')
    .select('*')
    .eq('id', id)
    .eq('company_id', companyId)
    .single()

  if (existingError || !existing) {
    throw new Error('Quote not found')
  }

  if (existing.status === 'approved') {
    throw new Error('Cannot edit approved quote')
  }

  const { items, ...quoteData } = data

  let totalAmountCents: number | undefined
  if (items) {
    totalAmountCents = items.reduce(
      (sum, item) => sum + (item.quantity * item.unitPriceCents),
      0
    )

    const { error: deleteError } = await supabase
      .from('quote_items')
      .delete()
      .eq('quote_id', id)
      .eq('company_id', companyId)

    if (deleteError) {
      throw new Error('Failed to delete quote items: ' + deleteError.message)
    }

    for (const item of items) {
      const { error: itemError } = await supabase
        .from('quote_items')
        .insert({
          ...item,
          company_id: companyId,
          quote_id: id,
        })

      if (itemError) {
        throw new Error('Failed to create quote item: ' + itemError.message)
      }
    }
  }

  const { data: updated, error: updateError } = await supabase
    .from('quotes')
    .update({
      ...quoteData,
      ...(totalAmountCents !== undefined && { total_amount_cents: totalAmountCents }),
    })
    .eq('id', id)
    .select()
    .single()

  if (updateError) {
    throw new Error('Failed to update quote: ' + updateError.message)
  }

  return updated
}

export async function updateQuoteStatus(id: string, status: string, companyId: string) {
  const { data: quote, error: quoteError } = await supabase
    .from('quotes')
    .select('*')
    .eq('id', id)
    .eq('company_id', companyId)
    .single()

  if (quoteError || !quote) {
    throw new Error('Quote not found')
  }

  const validTransitions: Record<string, string[]> = {
    draft: ['sent', 'approved', 'cancelled'],
    sent: ['approved', 'rejected', 'cancelled'],
    approved: [],
    rejected: [],
    cancelled: [],
  }

  const currentStatus = quote.status
  const allowedTransitions = validTransitions[currentStatus] || []

  if (!allowedTransitions.includes(status)) {
    throw new Error(`Invalid status transition from ${currentStatus} to ${status}`)
  }

  const { data: updated, error: updateError } = await supabase
    .from('quotes')
    .update({ status })
    .eq('id', id)
    .select()
    .single()

  if (updateError) {
    throw new Error('Failed to update quote status: ' + updateError.message)
  }

  return updated
}

export async function deleteQuote(id: string, companyId: string) {
  const { data: quote, error: quoteError } = await supabase
    .from('quotes')
    .select('*')
    .eq('id', id)
    .eq('company_id', companyId)
    .single()

  if (quoteError || !quote) {
    throw new Error('Quote not found or does not belong to this company')
  }

  const { error: deleteItemsError } = await supabase
    .from('quote_items')
    .delete()
    .eq('quote_id', id)
    .eq('company_id', companyId)

  if (deleteItemsError) {
    throw new Error('Failed to delete quote items: ' + deleteItemsError.message)
  }

  const { error: deleteError } = await supabase
    .from('quotes')
    .delete()
    .eq('id', id)

  if (deleteError) {
    throw new Error('Failed to delete quote: ' + deleteError.message)
  }
}

export async function createJob(data: JobInput, companyId: string) {
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('*')
    .eq('id', data.customerId)
    .eq('company_id', companyId)
    .single()

  if (customerError || !customer) {
    throw new Error('Customer not found or does not belong to this company')
  }

  if (data.quoteId) {
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', data.quoteId)
      .eq('company_id', companyId)
      .single()

    if (quoteError || !quote) {
      throw new Error('Quote not found or does not belong to this company')
    }
  }

  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .insert({
      ...data,
      company_id: companyId,
    })
    .select()
    .single()

  if (jobError) {
    throw new Error('Failed to create job: ' + jobError.message)
  }

  return job
}

export async function updateJob(id: string, data: Partial<JobInput>, companyId: string) {
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', id)
    .eq('company_id', companyId)
    .single()

  if (jobError || !job) {
    throw new Error('Job not found or does not belong to this company')
  }

  const { data: updated, error: updateError } = await supabase
    .from('jobs')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (updateError) {
    throw new Error('Failed to update job: ' + updateError.message)
  }

  return updated
}

export async function updateJobStatus(id: string, status: string, companyId: string) {
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', id)
    .eq('company_id', companyId)
    .single()

  if (jobError || !job) {
    throw new Error('Job not found or does not belong to this company')
  }

  const { data: updated, error: updateError } = await supabase
    .from('jobs')
    .update({ status })
    .eq('id', id)
    .select()
    .single()

  if (updateError) {
    throw new Error('Failed to update job status: ' + updateError.message)
  }

  return updated
}

export async function approveQuoteAndCreateJob(quoteId: string, companyId: string) {
  const { data, error } = await supabase.rpc('approve_quote_and_create_job', {
    p_quote_id: quoteId
  })

  if (error) {
    throw new Error('Failed to approve quote and create job: ' + error.message)
  }

  // Fetch the created job
  const jobId = data?.job_id
  if (!jobId) {
    throw new Error('Failed to get job ID from RPC response')
  }

  const { data: job, error: fetchError } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .single()

  if (fetchError) {
    throw new Error('Failed to fetch created job: ' + fetchError.message)
  }

  return job
}

export async function deleteJob(id: string, companyId: string) {
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', id)
    .eq('company_id', companyId)
    .single()

  if (jobError || !job) {
    throw new Error('Job not found or does not belong to this company')
  }

  const { error: deleteMaterialsError } = await supabase
    .from('job_materials')
    .delete()
    .eq('job_id', id)
    .eq('company_id', companyId)

  if (deleteMaterialsError) {
    throw new Error('Failed to delete job materials: ' + deleteMaterialsError.message)
  }

  const { error: deleteError } = await supabase
    .from('jobs')
    .delete()
    .eq('id', id)

  if (deleteError) {
    throw new Error('Failed to delete job: ' + deleteError.message)
  }
}

export async function createMaterial(data: MaterialInput, companyId: string) {
  const { data: material, error } = await supabase
    .from('materials')
    .insert({
      ...data,
      company_id: companyId,
    })
    .select()
    .single()

  if (error) {
    throw new Error('Failed to create material: ' + error.message)
  }

  return material
}

export async function updateMaterial(id: string, data: Partial<MaterialInput>, companyId: string) {
  const { data: material, error: materialError } = await supabase
    .from('materials')
    .select('*')
    .eq('id', id)
    .eq('company_id', companyId)
    .single()

  if (materialError || !material) {
    throw new Error('Material not found or does not belong to this company')
  }

  const { data: updated, error: updateError } = await supabase
    .from('materials')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (updateError) {
    throw new Error('Failed to update material: ' + updateError.message)
  }

  return updated
}

export async function deleteMaterial(id: string, companyId: string) {
  const { data: material, error: materialError } = await supabase
    .from('materials')
    .select('*')
    .eq('id', id)
    .eq('company_id', companyId)
    .single()

  if (materialError || !material) {
    throw new Error('Material not found or does not belong to this company')
  }

  const { error: deleteVariantsError } = await supabase
    .from('material_variants')
    .delete()
    .eq('material_id', id)
    .eq('company_id', companyId)

  if (deleteVariantsError) {
    throw new Error('Failed to delete material variants: ' + deleteVariantsError.message)
  }

  const { error: deleteError } = await supabase
    .from('materials')
    .delete()
    .eq('id', id)

  if (deleteError) {
    throw new Error('Failed to delete material: ' + deleteError.message)
  }
}

export async function createMaterialVariant(data: MaterialVariantInput, companyId: string) {
  const { data: variant, error } = await supabase
    .from('material_variants')
    .insert({
      ...data,
      company_id: companyId,
    })
    .select()
    .single()

  if (error) {
    throw new Error('Failed to create material variant: ' + error.message)
  }

  return variant
}

export async function deleteMaterialVariant(id: string, companyId: string) {
  const { data: variant, error: variantError } = await supabase
    .from('material_variants')
    .select('*')
    .eq('id', id)
    .eq('company_id', companyId)
    .single()

  if (variantError || !variant) {
    throw new Error('Material variant not found or does not belong to this company')
  }

  const { error: deleteError } = await supabase
    .from('material_variants')
    .delete()
    .eq('id', id)

  if (deleteError) {
    throw new Error('Failed to delete material variant: ' + deleteError.message)
  }
}

export async function addJobMaterial(jobId: string, data: JobMaterialInput, companyId: string) {
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .eq('company_id', companyId)
    .single()

  if (jobError || !job) {
    throw new Error('Job not found or does not belong to this company')
  }

  const { data: material, error: materialError } = await supabase
    .from('materials')
    .select('*')
    .eq('id', data.materialId)
    .eq('company_id', companyId)
    .single()

  if (materialError || !material) {
    throw new Error('Material not found or does not belong to this company')
  }

  const { data: jobMaterial, error } = await supabase
    .from('job_materials')
    .insert({
      ...data,
      job_id: jobId,
      company_id: companyId,
    })
    .select()
    .single()

  if (error) {
    throw new Error('Failed to create job material: ' + error.message)
  }

  return jobMaterial
}

export async function updateJobMaterial(id: string, data: Partial<JobMaterialInput>, companyId: string) {
  const { data: jobMaterial, error: jobMaterialError } = await supabase
    .from('job_materials')
    .select('*')
    .eq('id', id)
    .eq('company_id', companyId)
    .single()

  if (jobMaterialError || !jobMaterial) {
    throw new Error('Job material not found or does not belong to this company')
  }

  const { data: updated, error: updateError } = await supabase
    .from('job_materials')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (updateError) {
    throw new Error('Failed to update job material: ' + updateError.message)
  }

  return updated
}

export async function deleteJobMaterial(id: string, companyId: string) {
  const { data: jobMaterial, error: jobMaterialError } = await supabase
    .from('job_materials')
    .select('*')
    .eq('id', id)
    .eq('company_id', companyId)
    .single()

  if (jobMaterialError || !jobMaterial) {
    throw new Error('Job material not found or does not belong to this company')
  }

  const { error: deleteError } = await supabase
    .from('job_materials')
    .delete()
    .eq('id', id)

  if (deleteError) {
    throw new Error('Failed to delete job material: ' + deleteError.message)
  }
}

export async function createStockMovement(data: StockMovementInput, companyId: string) {
  const { data: material, error: materialError } = await supabase
    .from('materials')
    .select('*')
    .eq('id', data.materialId)
    .eq('company_id', companyId)
    .single()

  if (materialError || !material) {
    throw new Error('Material not found')
  }

  const currentQuantity = Number(material.current_quantity)
  const quantityChange = data.movementType === 'in'
    ? data.quantity
    : data.movementType === 'out'
      ? -data.quantity
      : data.quantity

  const newQuantity = currentQuantity + quantityChange

  if (newQuantity < 0) {
    throw new Error(`Estoque insuficiente. Disponível: ${currentQuantity}`)
  }

  const { data: movement, error: movementError } = await supabase
    .from('stock_movements')
    .insert({
      ...data,
      company_id: companyId,
      movement_type: data.movementType === 'in' ? 'in' : 'out',
    })
    .select()
    .single()

  if (movementError) {
    throw new Error('Failed to create stock movement: ' + movementError.message)
  }

  const { error: updateError } = await supabase
    .from('materials')
    .update({ current_quantity: String(newQuantity) })
    .eq('id', data.materialId)

  if (updateError) {
    throw new Error('Failed to update material quantity: ' + updateError.message)
  }

  return movement
}

export async function createReceivable(data: ReceivableInput, companyId: string) {
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('*')
    .eq('id', data.customerId)
    .eq('company_id', companyId)
    .single()

  if (customerError || !customer) {
    throw new Error('Customer not found or does not belong to this company')
  }

  if (data.jobId) {
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', data.jobId)
      .eq('company_id', companyId)
      .single()

    if (jobError || !job) {
      throw new Error('Job not found or does not belong to this company')
    }
  }

  const { data: receivable, error } = await supabase
    .from('receivables')
    .insert({
      ...data,
      company_id: companyId,
      amount_cents: data.amountCents,
      due_date: data.dueDate,
    })
    .select()
    .single()

  if (error) {
    throw new Error('Failed to create receivable: ' + error.message)
  }

  return receivable
}

export async function updateReceivable(id: string, data: Partial<ReceivableInput>, companyId: string) {
  const { data: receivable, error: receivableError } = await supabase
    .from('receivables')
    .select('*')
    .eq('id', id)
    .eq('company_id', companyId)
    .single()

  if (receivableError || !receivable) {
    throw new Error('Receivable not found or does not belong to this company')
  }

  const { data: updated, error: updateError } = await supabase
    .from('receivables')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (updateError) {
    throw new Error('Failed to update receivable: ' + updateError.message)
  }

  return updated
}

export async function markReceivableAsReceived(id: string, companyId: string) {
  const { data: receivable, error: receivableError } = await supabase
    .from('receivables')
    .select('*')
    .eq('id', id)
    .eq('company_id', companyId)
    .single()

  if (receivableError || !receivable) {
    throw new Error('Receivable not found')
  }

  if (receivable.status === 'received') {
    return receivable
  }

  const { data: updated, error: updateError } = await supabase
    .from('receivables')
    .update({
      status: 'received',
      received_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (updateError) {
    throw new Error('Failed to mark receivable as received: ' + updateError.message)
  }

  return updated
}

export async function deleteReceivable(id: string, companyId: string) {
  const { data: receivable, error: receivableError } = await supabase
    .from('receivables')
    .select('*')
    .eq('id', id)
    .eq('company_id', companyId)
    .single()

  if (receivableError || !receivable) {
    throw new Error('Receivable not found or does not belong to this company')
  }

  const { error: deleteError } = await supabase
    .from('receivables')
    .delete()
    .eq('id', id)

  if (deleteError) {
    throw new Error('Failed to delete receivable: ' + deleteError.message)
  }
}

export async function createCompany(data: CompanyInput, userId: string) {
  const { data: companyId, error } = await supabase.rpc('create_company_with_membership', {
    p_name: data.name,
    p_responsible_name: data.responsibleName,
    p_phone: data.phone,
    p_business_type: data.businessType,
  })

  if (error) {
    throw new Error('Failed to create company: ' + error.message)
  }

  // Fetch the created company
  const { data: company, error: fetchError } = await supabase
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .single()

  if (fetchError) {
    throw new Error('Failed to fetch created company: ' + fetchError.message)
  }

  return company
}

export async function updateCompany(id: string, data: Partial<CompanyInput>) {
  const { data: updated, error } = await supabase
    .from('companies')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error('Failed to update company: ' + error.message)
  }

  return updated
}
