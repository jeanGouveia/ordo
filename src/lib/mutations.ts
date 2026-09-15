import { blink } from '@/blink/client'
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
  const customer = await blink.db.table('customers').create({
    ...data,
    id: `cust_${crypto.randomUUID()}`,
    companyId,
    createdAt: new Date().toISOString(),
  })
  return customer
}

export async function updateCustomer(id: string, data: Partial<CustomerInput>, companyId: string) {
  const customers = await blink.db.table('customers').list({
    where: { id, companyId }
  })
  const customer = customers[0]

  if (!customer) {
    throw new Error('Customer not found or does not belong to this company')
  }

  const updated = await blink.db.table('customers').update(id, data)
  return updated
}

export async function deleteCustomer(id: string, companyId: string) {
  const customers = await blink.db.table('customers').list({
    where: { id, companyId }
  })
  const customer = customers[0]

  if (!customer) {
    throw new Error('Customer not found or does not belong to this company')
  }

  await blink.db.table('customers').delete(id)
}

export async function createQuote(data: QuoteInput, companyId: string) {
  const { items, ...quoteData } = data

  const customers = await blink.db.table('customers').list({
    where: { id: quoteData.customerId, companyId }
  })
  const customer = customers[0]

  if (!customer) {
    throw new Error('Customer not found or does not belong to this company')
  }

  const totalAmountCents = items.reduce(
    (sum, item) => sum + (item.quantity * item.unitPriceCents),
    0
  )

  const quote = await blink.db.table('quotes').create({
    ...quoteData,
    id: `quote_${crypto.randomUUID()}`,
    companyId,
    totalAmountCents,
    createdAt: new Date().toISOString(),
  })

  for (const item of items) {
    await blink.db.table('quoteItems').create({
      ...item,
      id: `qitem_${crypto.randomUUID()}`,
      quoteId: quote.id,
      companyId,
      createdAt: new Date().toISOString(),
    })
  }

  return quote
}

export async function updateQuote(id: string, data: Partial<QuoteInput>, companyId: string) {
  const quotes = await blink.db.table('quotes').list({
    where: { id, companyId }
  })
  const existing = quotes[0]

  if (!existing) {
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

    await blink.db.table('quoteItems').deleteMany({
      where: { quoteId: id, companyId },
    })

    for (const item of items) {
      await blink.db.table('quoteItems').create({
        ...item,
        id: `qitem_${crypto.randomUUID()}`,
        quoteId: id,
        companyId,
        createdAt: new Date().toISOString(),
      })
    }
  }

  const quote = await blink.db.table('quotes').update(id, {
    ...quoteData,
    ...(totalAmountCents !== undefined && { totalAmountCents }),
  })

  return quote
}

export async function updateQuoteStatus(id: string, status: string, companyId: string) {
  const quotes = await blink.db.table('quotes').list({
    where: { id, companyId }
  })
  const quote = quotes[0]

  if (!quote) {
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

  const updated = await blink.db.table('quotes').update(id, { status })
  return updated
}

export async function deleteQuote(id: string, companyId: string) {
  const quotes = await blink.db.table('quotes').list({
    where: { id, companyId }
  })
  const quote = quotes[0]

  if (!quote) {
    throw new Error('Quote not found or does not belong to this company')
  }

  await blink.db.table('quoteItems').deleteMany({
    where: { quoteId: id, companyId },
  })
  await blink.db.table('quotes').delete(id)
}

export async function createJob(data: JobInput, companyId: string) {
  const customers = await blink.db.table('customers').list({
    where: { id: data.customerId, companyId }
  })
  const customer = customers[0]

  if (!customer) {
    throw new Error('Customer not found or does not belong to this company')
  }

  if (data.quoteId) {
    const quotes = await blink.db.table('quotes').list({
      where: { id: data.quoteId, companyId }
    })
    const quote = quotes[0]

    if (!quote) {
      throw new Error('Quote not found or does not belong to this company')
    }
  }

  const job = await blink.db.table('jobs').create({
    ...data,
    id: `job_${crypto.randomUUID()}`,
    companyId,
    createdAt: new Date().toISOString(),
  })
  return job
}

export async function updateJob(id: string, data: Partial<JobInput>, companyId: string) {
  const jobs = await blink.db.table('jobs').list({
    where: { id, companyId }
  })
  const job = jobs[0]

  if (!job) {
    throw new Error('Job not found or does not belong to this company')
  }

  const updated = await blink.db.table('jobs').update(id, data)
  return updated
}

export async function updateJobStatus(id: string, status: string, companyId: string) {
  const jobs = await blink.db.table('jobs').list({
    where: { id, companyId }
  })
  const job = jobs[0]

  if (!job) {
    throw new Error('Job not found or does not belong to this company')
  }

  const updated = await blink.db.table('jobs').update(id, { status })
  return updated
}

export async function approveQuoteAndCreateJob(quoteId: string, companyId: string) {
  const jobs = await blink.db.table('jobs').list({
    where: { quoteId, companyId }
  })
  const existingJob = jobs[0]

  if (existingJob) {
    return existingJob
  }

  const quotes = await blink.db.table('quotes').list({
    where: { id: quoteId, companyId }
  })
  const quote = quotes[0]

  if (!quote) {
    throw new Error('Quote not found')
  }

  await blink.db.table('quotes').update(quoteId, { status: 'approved' })

  const job = await blink.db.table('jobs').create({
    id: `job_${crypto.randomUUID()}`,
    companyId,
    customerId: quote.customerId,
    quoteId: quote.id,
    title: quote.title,
    description: quote.description,
    dueDate: null,
    status: 'waiting',
    totalAmountCents: quote.totalAmountCents,
    createdAt: new Date().toISOString(),
  })

  return job
}

export async function deleteJob(id: string, companyId: string) {
  const jobs = await blink.db.table('jobs').list({
    where: { id, companyId }
  })
  const job = jobs[0]

  if (!job) {
    throw new Error('Job not found or does not belong to this company')
  }

  await blink.db.table('jobMaterials').deleteMany({
    where: { jobId: id, companyId },
  })
  await blink.db.table('jobs').delete(id)
}

export async function createMaterial(data: MaterialInput, companyId: string) {
  const material = await blink.db.table('materials').create({
    ...data,
    id: `mat_${crypto.randomUUID()}`,
    companyId,
    createdAt: new Date().toISOString(),
  })
  return material
}

export async function updateMaterial(id: string, data: Partial<MaterialInput>, companyId: string) {
  const materials = await blink.db.table('materials').list({
    where: { id, companyId }
  })
  const material = materials[0]

  if (!material) {
    throw new Error('Material not found or does not belong to this company')
  }

  const updated = await blink.db.table('materials').update(id, data)
  return updated
}

export async function deleteMaterial(id: string, companyId: string) {
  const materials = await blink.db.table('materials').list({
    where: { id, companyId }
  })
  const material = materials[0]

  if (!material) {
    throw new Error('Material not found or does not belong to this company')
  }

  await blink.db.table('materialVariants').deleteMany({
    where: { materialId: id, companyId },
  })
  await blink.db.table('materials').delete(id)
}

export async function createMaterialVariant(data: MaterialVariantInput, companyId: string) {
  const variant = await blink.db.table('materialVariants').create({
    ...data,
    id: `mvar_${crypto.randomUUID()}`,
    companyId,
    createdAt: new Date().toISOString(),
  })
  return variant
}

export async function deleteMaterialVariant(id: string, companyId: string) {
  const variants = await blink.db.table('materialVariants').list({
    where: { id, companyId }
  })
  const variant = variants[0]

  if (!variant) {
    throw new Error('Material variant not found or does not belong to this company')
  }

  await blink.db.table('materialVariants').delete(id)
}

export async function addJobMaterial(jobId: string, data: JobMaterialInput, companyId: string) {
  const jobs = await blink.db.table('jobs').list({
    where: { id: jobId, companyId }
  })
  const job = jobs[0]

  if (!job) {
    throw new Error('Job not found or does not belong to this company')
  }

  const materials = await blink.db.table('materials').list({
    where: { id: data.materialId, companyId }
  })
  const material = materials[0]

  if (!material) {
    throw new Error('Material not found or does not belong to this company')
  }

  const jobMaterial = await blink.db.table('jobMaterials').create({
    ...data,
    id: `jmat_${crypto.randomUUID()}`,
    jobId,
    companyId,
    createdAt: new Date().toISOString(),
  })
  return jobMaterial
}

export async function updateJobMaterial(id: string, data: Partial<JobMaterialInput>, companyId: string) {
  const jobMaterials = await blink.db.table('jobMaterials').list({
    where: { id, companyId }
  })
  const jobMaterial = jobMaterials[0]

  if (!jobMaterial) {
    throw new Error('Job material not found or does not belong to this company')
  }

  const updated = await blink.db.table('jobMaterials').update(id, data)
  return updated
}

export async function deleteJobMaterial(id: string, companyId: string) {
  const jobMaterials = await blink.db.table('jobMaterials').list({
    where: { id, companyId }
  })
  const jobMaterial = jobMaterials[0]

  if (!jobMaterial) {
    throw new Error('Job material not found or does not belong to this company')
  }

  await blink.db.table('jobMaterials').delete(id)
}

export async function createStockMovement(data: StockMovementInput, companyId: string) {
  const materials = await blink.db.table('materials').list({
    where: { id: data.materialId, companyId }
  })
  const material = materials[0]

  if (!material) {
    throw new Error('Material not found')
  }

  const currentQuantity = Number(material.currentQuantity)
  const quantityChange = data.movementType === 'entry'
    ? data.quantity
    : data.movementType === 'exit'
      ? -data.quantity
      : data.quantity

  const newQuantity = currentQuantity + quantityChange

  if (newQuantity < 0) {
    throw new Error(`Estoque insuficiente. Disponível: ${currentQuantity}`)
  }

  const movement = await blink.db.table('stockMovements').create({
    ...data,
    id: `smov_${crypto.randomUUID()}`,
    companyId,
    createdAt: new Date().toISOString(),
  })

  await blink.db.table('materials').update(data.materialId, { currentQuantity: String(newQuantity) })

  return movement
}

export async function createReceivable(data: ReceivableInput, companyId: string) {
  const customers = await blink.db.table('customers').list({
    where: { id: data.customerId, companyId }
  })
  const customer = customers[0]

  if (!customer) {
    throw new Error('Customer not found or does not belong to this company')
  }

  if (data.jobId) {
    const jobs = await blink.db.table('jobs').list({
      where: { id: data.jobId, companyId }
    })
    const job = jobs[0]

    if (!job) {
      throw new Error('Job not found or does not belong to this company')
    }
  }

  if (data.quoteId) {
    const quotes = await blink.db.table('quotes').list({
      where: { id: data.quoteId, companyId }
    })
    const quote = quotes[0]

    if (!quote) {
      throw new Error('Quote not found or does not belong to this company')
    }
  }

  const receivable = await blink.db.table('receivables').create({
    ...data,
    id: `recv_${crypto.randomUUID()}`,
    companyId,
    createdAt: new Date().toISOString(),
  })
  return receivable
}

export async function updateReceivable(id: string, data: Partial<ReceivableInput>, companyId: string) {
  const receivables = await blink.db.table('receivables').list({
    where: { id, companyId }
  })
  const receivable = receivables[0]

  if (!receivable) {
    throw new Error('Receivable not found or does not belong to this company')
  }

  const updated = await blink.db.table('receivables').update(id, data)
  return updated
}

export async function markReceivableAsReceived(id: string, companyId: string) {
  const receivables = await blink.db.table('receivables').list({
    where: { id, companyId }
  })
  const receivable = receivables[0]

  if (!receivable) {
    throw new Error('Receivable not found')
  }

  if (receivable.status === 'received') {
    return receivable
  }

  const updated = await blink.db.table('receivables').update(id, {
    status: 'received',
    receivedAt: new Date().toISOString(),
  })
  return updated
}

export async function deleteReceivable(id: string, companyId: string) {
  const receivables = await blink.db.table('receivables').list({
    where: { id, companyId }
  })
  const receivable = receivables[0]

  if (!receivable) {
    throw new Error('Receivable not found or does not belong to this company')
  }

  await blink.db.table('receivables').delete(id)
}

export async function createCompany(data: CompanyInput, userId: string) {
  const company = await blink.db.table('companies').create({
    ...data,
    id: `cmp_${crypto.randomUUID()}`,
    ownerUserId: userId,
    createdAt: new Date().toISOString(),
  })
  return company
}

export async function updateCompany(id: string, data: Partial<CompanyInput>) {
  const company = await blink.db.table('companies').update(id, data)
  return company
}
