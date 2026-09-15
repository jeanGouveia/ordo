import type { MaterialsRow, JobsRow, JobMaterialsRow, MaterialVariantsRow } from '@/lib/db-types'

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
  jobMaterials: JobMaterialsRow[],
  materialVariants: MaterialVariantsRow[] = []
): StockFutureCalculation {
  const requirements: MaterialRequirement[] = []
  
  for (const material of materials) {
    const currentQuantity = Number(material.currentQuantity)
    const materialJobMaterials = jobMaterials.filter(jm => jm.materialId === material.id)
    
    if (materialJobMaterials.length === 0) {
      continue
    }

    const variants = materialVariants.filter(mv => mv.materialId === material.id)
    
    if (variants.length === 0) {
      const requirement = calculateForMaterial(material, materialJobMaterials, jobs, currentQuantity, null)
      if (requirement && requirement.missingQuantity > 0) {
        requirements.push(requirement)
      }
    } else {
      for (const variant of variants) {
        const variantJobMaterials = materialJobMaterials.filter(jm => jm.variant === variant.label)
        if (variantJobMaterials.length === 0) {
          continue
        }
        
        const requirement = calculateForMaterial(material, variantJobMaterials, jobs, currentQuantity, variant.label)
        if (requirement && requirement.missingQuantity > 0) {
          requirements.push(requirement)
        }
      }
      
      const variantlessJobMaterials = materialJobMaterials.filter(jm => !jm.variant)
      if (variantlessJobMaterials.length > 0) {
        const requirement = calculateForMaterial(material, variantlessJobMaterials, jobs, currentQuantity, null)
        if (requirement && requirement.missingQuantity > 0) {
          requirements.push(requirement)
        }
      }
    }
  }

  const sufficient = requirements.every(req => req.missingQuantity === 0)

  return {
    sufficient,
    requirements,
  }
}

function calculateForMaterial(
  material: MaterialsRow,
  materialJobMaterials: JobMaterialsRow[],
  jobs: JobsRow[],
  currentQuantity: number,
  variantLabel: string | null
): MaterialRequirement | null {
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
  let criticalDate: string | null = null

  for (const job of relatedJobs) {
    projectedQuantity -= job.quantity
    
    if (projectedQuantity < 0 && criticalDate === null) {
      criticalDate = job.jobDueDate
    }
  }

  const missingQuantity = Math.max(0, -projectedQuantity)
  const totalRequired = relatedJobs.reduce((sum, job) => sum + job.quantity, 0)

  if (missingQuantity === 0) {
    return null
  }

  return {
    materialId: material.id,
    materialName: material.name,
    variant: variantLabel,
    currentQuantity,
    requiredQuantity: totalRequired,
    missingQuantity,
    criticalDate,
    relatedJobs,
  }
}


