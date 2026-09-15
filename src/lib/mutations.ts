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
  const customer = await blink.db.customers.create({
    data: {
      ...data,
      id: `cust_${crypto.randomUUID()}`,
      companyId,
      createdAt: new Date().toISOString(),
    },
  })
  return customer
}

export async function updateCustomer(id: string, data: Partial<CustomerInput>, companyId: string) {
  const customer = await blink.db.customers.update({
    where: { id, companyId },
    data,
  })
  return customer
}

export async function deleteCustomer(id: string, companyId: string) {
  await blink.db.customers.delete({
    where: { id, companyId },
  })
}

export async function createQuote(data: QuoteInput, companyId: string) {
  const { items, ...quoteData } = data
  
  const customer = await blink.db.customers.findFirst({
    where: { id: quoteData.customerId, companyId },
  })

  if (!customer) {
    throw new Error('Customer not found or does not belong to this company')
  }

  const totalAmountCents = items.reduce(
    (sum, item) => sum + (item.quantity * item.unitPriceCents),
    0
  )

  const quote = await blink.db.quotes.create({
    data: {
      ...quoteData,
      id: `quote_${crypto.randomUUID()}`,
      companyId,
      totalAmountCents,
      createdAt: new Date().toISOString(),
    },
  })

  for (const item of items) {
    await blink.db.quoteItems.create({
      data: {
        ...item,
        id: `qitem_${crypto.randomUUID()}`,
        quoteId: quote.id,
        companyId,
        createdAt: new Date().toISOString(),
      },
    })
  }

  return quote
}

export async function updateQuote(id: string, data: Partial<QuoteInput>, companyId: string) {
  const existing = await blink.db.quotes.findFirst({
    where: { id, companyId },
  })

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
    
    await blink.db.quoteItems.deleteMany({
      where: { quoteId: id, companyId },
    })
    
    for (const item of items) {
      await blink.db.quoteItems.create({
        data: {
          ...item,
          id: `qitem_${crypto.randomUUID()}`,
          quoteId: id,
          companyId,
          createdAt: new Date().toISOString(),
        },
      })
    }
  }

  const quote = await blink.db.quotes.update({
    where: { id, companyId },
    data: {
      ...quoteData,
      ...(totalAmountCents !== undefined && { totalAmountCents }),
    },
  })

  return quote
}

export async function updateQuoteStatus(id: string, status: string, companyId: string) {
  const quote = await blink.db.quotes.findFirst({
    where: { id, companyId },
  })

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

  const updated = await blink.db.quotes.update({
    where: { id, companyId },
    data: { status },
  })
  return updated
}

export async function deleteQuote(id: string, companyId: string) {
  await blink.db.quoteItems.deleteMany({
    where: { quoteId: id, companyId },
  })
  await blink.db.quotes.delete({
    where: { id, companyId },
  })
}

export async function createJob(data: JobInput, companyId: string) {
  const customer = await blink.db.customers.findFirst({
    where: { id: data.customerId, companyId },
  })

  if (!customer) {
    throw new Error('Customer not found or does not belong to this company')
  }

  if (data.quoteId) {
    const quote = await blink.db.quotes.findFirst({
      where: { id: data.quoteId, companyId },
    })

    if (!quote) {
      throw new Error('Quote not found or does not belong to this company')
    }
  }

  const job = await blink.db.jobs.create({
    data: {
      ...data,
      id: `job_${crypto.randomUUID()}`,
      companyId,
      createdAt: new Date().toISOString(),
    },
  })
  return job
}

export async function updateJob(id: string, data: Partial<JobInput>, companyId: string) {
  const job = await blink.db.jobs.update({
    where: { id, companyId },
    data,
  })
  return job
}

export async function updateJobStatus(id: string, status: string, companyId: string) {
  const job = await blink.db.jobs.update({
    where: { id, companyId },
    data: { status },
  })
  return job
}

export async function approveQuoteAndCreateJob(quoteId: string, companyId: string) {
  const existingJob = await blink.db.jobs.findFirst({
    where: { quoteId, companyId },
  })

  if (existingJob) {
    return existingJob
  }

  const quote = await blink.db.quotes.findFirst({
    where: { id: quoteId, companyId },
  })

  if (!quote) {
    throw new Error('Quote not found')
  }

  await blink.db.quotes.update({
    where: { id: quoteId, companyId },
    data: { status: 'approved' },
  })

  const job = await blink.db.jobs.create({
    data: {
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
    },
  })

  return job
}

export async function deleteJob(id: string, companyId: string) {
  await blink.db.jobMaterials.deleteMany({
    where: { jobId: id, companyId },
  })
  await blink.db.jobs.delete({
    where: { id, companyId },
  })
}

export async function createMaterial(data: MaterialInput, companyId: string) {
  const material = await blink.db.materials.create({
    data: {
      ...data,
      id: `mat_${crypto.randomUUID()}`,
      companyId,
      createdAt: new Date().toISOString(),
    },
  })
  return material
}

export async function updateMaterial(id: string, data: Partial<MaterialInput>, companyId: string) {
  const material = await blink.db.materials.update({
    where: { id, companyId },
    data,
  })
  return material
}

export async function deleteMaterial(id: string, companyId: string) {
  await blink.db.materialVariants.deleteMany({
    where: { materialId: id, companyId },
  })
  await blink.db.materials.delete({
    where: { id, companyId },
  })
}

export async function createMaterialVariant(data: MaterialVariantInput, companyId: string) {
  const variant = await blink.db.materialVariants.create({
    data: {
      ...data,
      id: `mvar_${crypto.randomUUID()}`,
      companyId,
      createdAt: new Date().toISOString(),
    },
  })
  return variant
}

export async function deleteMaterialVariant(id: string, companyId: string) {
  await blink.db.materialVariants.delete({
    where: { id, companyId },
  })
}

export async function addJobMaterial(jobId: string, data: JobMaterialInput, companyId: string) {
  const job = await blink.db.jobs.findFirst({
    where: { id: jobId, companyId },
  })

  if (!job) {
    throw new Error('Job not found or does not belong to this company')
  }

  const material = await blink.db.materials.findFirst({
    where: { id: data.materialId, companyId },
  })

  if (!material) {
    throw new Error('Material not found or does not belong to this company')
  }

  const jobMaterial = await blink.db.jobMaterials.create({
    data: {
      ...data,
      id: `jmat_${crypto.randomUUID()}`,
      jobId,
      companyId,
      createdAt: new Date().toISOString(),
    },
  })
  return jobMaterial
}

export async function updateJobMaterial(id: string, data: Partial<JobMaterialInput>, companyId: string) {
  const jobMaterial = await blink.db.jobMaterials.update({
    where: { id, companyId },
    data,
  })
  return jobMaterial
}

export async function deleteJobMaterial(id: string, companyId: string) {
  await blink.db.jobMaterials.delete({
    where: { id, companyId },
  })
}

export async function createStockMovement(data: StockMovementInput, companyId: string) {
  const material = await blink.db.materials.findFirst({
    where: { id: data.materialId, companyId },
  })

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

  const movement = await blink.db.stockMovements.create({
    data: {
      ...data,
      id: `smov_${crypto.randomUUID()}`,
      companyId,
      createdAt: new Date().toISOString(),
    },
  })

  await blink.db.materials.update({
    where: { id: data.materialId, companyId },
    data: { currentQuantity: String(newQuantity) },
  })

  return movement
}

export async function createReceivable(data: ReceivableInput, companyId: string) {
  const customer = await blink.db.customers.findFirst({
    where: { id: data.customerId, companyId },
  })

  if (!customer) {
    throw new Error('Customer not found or does not belong to this company')
  }

  if (data.jobId) {
    const job = await blink.db.jobs.findFirst({
      where: { id: data.jobId, companyId },
    })

    if (!job) {
      throw new Error('Job not found or does not belong to this company')
    }
  }

  if (data.quoteId) {
    const quote = await blink.db.quotes.findFirst({
      where: { id: data.quoteId, companyId },
    })

    if (!quote) {
      throw new Error('Quote not found or does not belong to this company')
    }
  }

  const receivable = await blink.db.receivables.create({
    data: {
      ...data,
      id: `recv_${crypto.randomUUID()}`,
      companyId,
      createdAt: new Date().toISOString(),
    },
  })
  return receivable
}

export async function updateReceivable(id: string, data: Partial<ReceivableInput>, companyId: string) {
  const receivable = await blink.db.receivables.update({
    where: { id, companyId },
    data,
  })
  return receivable
}

export async function markReceivableAsReceived(id: string, companyId: string) {
  const receivable = await blink.db.receivables.findFirst({
    where: { id, companyId },
  })

  if (!receivable) {
    throw new Error('Receivable not found')
  }

  if (receivable.status === 'received') {
    return receivable
  }

  const updated = await blink.db.receivables.update({
    where: { id, companyId },
    data: { 
      status: 'received',
      receivedAt: new Date().toISOString(),
    },
  })
  return updated
}

export async function deleteReceivable(id: string, companyId: string) {
  await blink.db.receivables.delete({
    where: { id, companyId },
  })
}

export async function createCompany(data: CompanyInput, userId: string) {
  const company = await blink.db.companies.create({
    data: {
      ...data,
      id: `cmp_${crypto.randomUUID()}`,
      ownerUserId: userId,
      createdAt: new Date().toISOString(),
    },
  })
  return company
}

export async function updateCompany(id: string, data: Partial<CompanyInput>) {
  const company = await blink.db.companies.update({
    where: { id },
    data,
  })
  return company
}
