import { blink } from '@/blink/client'
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
    return await blink.db.companies.findFirst({
      where: { ownerUserId: userId },
    })
  } catch (error) {
    console.error('Error fetching company:', error)
    return null
  }
}

export async function createCompany(data: Omit<CompaniesRow, 'id' | 'createdAt' | 'ownerUserId'>, userId: string): Promise<CompaniesRow> {
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

export async function getCustomers(companyId: string): Promise<CustomersRow[]> {
  try {
    return await blink.db.customers.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    })
  } catch (error) {
    console.error('Error fetching customers:', error)
    return []
  }
}

export async function getCustomerById(id: string, companyId: string): Promise<CustomersRow | null> {
  try {
    return await blink.db.customers.findFirst({
      where: { id, companyId },
    })
  } catch (error) {
    console.error('Error fetching customer:', error)
    return null
  }
}

export async function searchCustomers(companyId: string, query: string): Promise<CustomersRow[]> {
  try {
    return await blink.db.customers.findMany({
      where: { 
        companyId,
        name: { contains: query, mode: 'insensitive' },
      },
      orderBy: { createdAt: 'desc' },
    })
  } catch (error) {
    console.error('Error searching customers:', error)
    return []
  }
}

export async function getQuotes(companyId: string): Promise<QuotesRow[]> {
  try {
    return await blink.db.quotes.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    })
  } catch (error) {
    console.error('Error fetching quotes:', error)
    return []
  }
}

export async function getQuoteById(id: string, companyId: string): Promise<QuotesRow | null> {
  try {
    return await blink.db.quotes.findFirst({
      where: { id, companyId },
    })
  } catch (error) {
    console.error('Error fetching quote:', error)
    return null
  }
}

export async function getQuoteItems(quoteId: string, companyId: string): Promise<QuoteItemsRow[]> {
  try {
    return await blink.db.quoteItems.findMany({
      where: { quoteId, companyId },
    })
  } catch (error) {
    console.error('Error fetching quote items:', error)
    return []
  }
}

export async function getJobs(companyId: string): Promise<JobsRow[]> {
  try {
    return await blink.db.jobs.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    })
  } catch (error) {
    console.error('Error fetching jobs:', error)
    return []
  }
}

export async function getJobById(id: string, companyId: string): Promise<JobsRow | null> {
  try {
    return await blink.db.jobs.findFirst({
      where: { id, companyId },
    })
  } catch (error) {
    console.error('Error fetching job:', error)
    return null
  }
}

export async function getJobMaterials(jobId: string, companyId: string): Promise<JobMaterialsRow[]> {
  try {
    return await blink.db.jobMaterials.findMany({
      where: { jobId, companyId },
    })
  } catch (error) {
    console.error('Error fetching job materials:', error)
    return []
  }
}

export async function getMaterials(companyId: string): Promise<MaterialsRow[]> {
  try {
    return await blink.db.materials.findMany({
      where: { companyId },
      orderBy: { name: 'asc' },
    })
  } catch (error) {
    console.error('Error fetching materials:', error)
    return []
  }
}

export async function getMaterialById(id: string, companyId: string): Promise<MaterialsRow | null> {
  try {
    return await blink.db.materials.findFirst({
      where: { id, companyId },
    })
  } catch (error) {
    console.error('Error fetching material:', error)
    return null
  }
}

export async function getMaterialVariants(companyId: string): Promise<MaterialVariantsRow[]> {
  try {
    return await blink.db.materialVariants.findMany({
      where: { companyId },
    })
  } catch (error) {
    console.error('Error fetching material variants:', error)
    return []
  }
}

export async function getStockMovements(companyId: string, materialId?: string): Promise<StockMovementsRow[]> {
  try {
    const where: any = { companyId }
    if (materialId) {
      where.materialId = materialId
    }
    return await blink.db.stockMovements.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
  } catch (error) {
    console.error('Error fetching stock movements:', error)
    return []
  }
}

export async function getReceivables(companyId: string): Promise<ReceivablesRow[]> {
  try {
    return await blink.db.receivables.findMany({
      where: { companyId },
      orderBy: { dueDate: 'asc' },
    })
  } catch (error) {
    console.error('Error fetching receivables:', error)
    return []
  }
}

export async function getReceivablesByStatus(companyId: string, status: string): Promise<ReceivablesRow[]> {
  try {
    return await blink.db.receivables.findMany({
      where: { companyId, status },
      orderBy: { dueDate: 'asc' },
    })
  } catch (error) {
    console.error('Error fetching receivables by status:', error)
    return []
  }
}
