// Auto-generated from your database schema — do not edit by hand.
// Regenerates automatically whenever a table is created or altered.

export type CompaniesRow = {
  id: string
  ownerUserId: string
  name: string
  responsibleName: string | null
  phone: string | null
  businessType: string | null
  createdAt: string
  userId: string | null
}

export type CustomersRow = {
  id: string
  companyId: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  notes: string | null
  createdAt: string
  userId: string | null
}

export type JobMaterialsRow = {
  id: string
  companyId: string
  jobId: string
  materialId: string
  variant: string | null
  quantity: string
  createdAt: string
  userId: string | null
}

export type JobsRow = {
  id: string
  companyId: string
  customerId: string
  title: string
  description: string | null
  dueDate: string | null
  status: string
  totalAmountCents: number | string
  createdAt: string
  userId: string | null
}

export type MaterialVariantsRow = {
  id: string
  companyId: string
  materialId: string
  label: string
  createdAt: string
  userId: string | null
}

export type MaterialsRow = {
  id: string
  companyId: string
  name: string
  unit: string
  currentQuantity: string
  minimumQuantity: string | null
  notes: string | null
  createdAt: string
  userId: string | null
}

export type QuoteItemsRow = {
  id: string
  companyId: string
  quoteId: string
  description: string
  quantity: string
  unitPriceCents: number | string
  createdAt: string
  userId: string | null
}

export type QuotesRow = {
  id: string
  companyId: string
  customerId: string
  title: string
  description: string | null
  status: string
  totalAmountCents: number | string
  validUntil: string | null
  estimatedDays: string | null
  notes: string | null
  createdAt: string
  userId: string | null
}

export type ReceivablesRow = {
  id: string
  companyId: string
  jobId: string
  customerId: string
  description: string
  amountCents: number | string
  dueDate: string
  status: string
  receivedAt: string | null
  createdAt: string
  userId: string | null
}

export type StockMovementsRow = {
  id: string
  companyId: string
  materialId: string
  jobId: string | null
  variant: string | null
  quantity: string
  movementType: string
  note: string | null
  createdAt: string
  userId: string | null
}

export type UsersRow = {
  id: string
  email: string
  emailVerified: number | string | null
  displayName: string | null
  avatarUrl: string | null
  phone: string | null
  phoneVerified: number | string | null
  role: string | null
  metadata: string | null
  createdAt: string
  updatedAt: string
  lastSignIn: string
}
