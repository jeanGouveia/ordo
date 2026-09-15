import type { MaterialsRow, JobsRow, JobMaterialsRow } from '@/lib/db-types'

export interface MaterialRequirement {
  materialId: string
  materialName: string
  variant: string | null
  currentQuantity: number
  requiredQuantity: number
  missingQuantity: number
  criticalDate: string | null
  relatedJobs: Array<{
    jobId: string
    jobTitle: string
    jobDueDate: string | null
    quantity: number
  }>
}

export interface StockFutureCalculation {
  sufficient: boolean
  requirements: MaterialRequirement[]
}

export function calculateStockFuture(
  materials: MaterialsRow[],
  jobs: JobsRow[],
  jobMaterials: JobMaterialsRow[]
): StockFutureCalculation {
  const requirements: MaterialRequirement[] = []
  
  for (const material of materials) {
    const currentQuantity = Number(material.currentQuantity)
    const materialJobMaterials = jobMaterials.filter(jm => jm.materialId === material.id)
    
    if (materialJobMaterials.length === 0) {
      continue
    }

    const relatedJobsMap = new Map<string, {
      job: JobsRow
      totalQuantity: number
    }>()

    for (const jm of materialJobMaterials) {
      const job = jobs.find(j => j.id === jm.jobId)
      if (!job || job.status === 'cancelled') {
        continue
      }

      const existing = relatedJobsMap.get(jm.jobId)
      if (existing) {
        existing.totalQuantity += Number(jm.quantity)
      } else {
        relatedJobsMap.set(jm.jobId, {
          job,
          totalQuantity: Number(jm.quantity),
        })
      }
    }

    if (relatedJobsMap.size === 0) {
      continue
    }

    const relatedJobs = Array.from(relatedJobsMap.entries())
      .map(([jobId, data]) => ({
        jobId,
        jobTitle: data.job.title,
        jobDueDate: data.job.dueDate,
        quantity: data.totalQuantity,
      }))
      .sort((a, b) => {
        if (!a.jobDueDate) return 1
        if (!b.jobDueDate) return -1
        return new Date(a.jobDueDate).getTime() - new Date(b.jobDueDate).getTime()
      })

    let projectedQuantity = currentQuantity
    let missingQuantity = 0
    let criticalDate: string | null = null

    for (const job of relatedJobs) {
      projectedQuantity -= job.quantity
      
      if (projectedQuantity < 0 && missingQuantity === 0) {
        missingQuantity = Math.abs(projectedQuantity)
        criticalDate = job.jobDueDate
      }
    }

    const totalRequired = relatedJobs.reduce((sum, job) => sum + job.quantity, 0)

    requirements.push({
      materialId: material.id,
      materialName: material.name,
      variant: null,
      currentQuantity,
      requiredQuantity: totalRequired,
      missingQuantity,
      criticalDate,
      relatedJobs,
    })
  }

  const sufficient = requirements.every(req => req.missingQuantity === 0)

  return {
    sufficient,
    requirements: requirements.filter(req => req.missingQuantity > 0),
  }
}

export function calculateStockFutureForMaterial(
  material: MaterialsRow,
  jobs: JobsRow[],
  jobMaterials: JobMaterialsRow[]
): MaterialRequirement | null {
  const currentQuantity = Number(material.currentQuantity)
  const materialJobMaterials = jobMaterials.filter(jm => jm.materialId === material.id)
  
  if (materialJobMaterials.length === 0) {
    return null
  }

  const relatedJobsMap = new Map<string, {
    job: JobsRow
    totalQuantity: number
  }>()

  for (const jm of materialJobMaterials) {
    const job = jobs.find(j => j.id === jm.jobId)
    if (!job || job.status === 'cancelled') {
      continue
    }

    const existing = relatedJobsMap.get(jm.jobId)
    if (existing) {
      existing.totalQuantity += Number(jm.quantity)
    } else {
      relatedJobsMap.set(jm.jobId, {
        job,
        totalQuantity: Number(jm.quantity),
      })
    }
  }

  if (relatedJobsMap.size === 0) {
    return null
  }

  const relatedJobs = Array.from(relatedJobsMap.entries())
    .map(([jobId, data]) => ({
      jobId,
      jobTitle: data.job.title,
      jobDueDate: data.job.dueDate,
      quantity: data.totalQuantity,
    }))
    .sort((a, b) => {
      if (!a.jobDueDate) return 1
      if (!b.jobDueDate) return -1
      return new Date(a.jobDueDate).getTime() - new Date(b.jobDueDate).getTime()
    })

  let projectedQuantity = currentQuantity
  let missingQuantity = 0
  let criticalDate: string | null = null

  for (const job of relatedJobs) {
    projectedQuantity -= job.quantity
    
    if (projectedQuantity < 0 && missingQuantity === 0) {
      missingQuantity = Math.abs(projectedQuantity)
      criticalDate = job.jobDueDate
    }
  }

  const totalRequired = relatedJobs.reduce((sum, job) => sum + job.quantity, 0)

  return {
    materialId: material.id,
    materialName: material.name,
    variant: null,
    currentQuantity,
    requiredQuantity: totalRequired,
    missingQuantity,
    criticalDate,
    relatedJobs,
  }
}
