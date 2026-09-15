import { z } from 'zod'

export const customerSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Nome é obrigatório'),
  whatsapp: z.string().min(1, 'WhatsApp é obrigatório'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  address: z.string().optional(),
  notes: z.string().optional(),
})

export type CustomerInput = z.infer<typeof customerSchema>

export const quoteItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, 'Descrição é obrigatória'),
  quantity: z.number().min(0.01, 'Quantidade deve ser maior que zero'),
  unitPriceCents: z.number().min(0, 'Preço unitário não pode ser negativo'),
})

export type QuoteItemInput = z.infer<typeof quoteItemSchema>

export const quoteSchema = z.object({
  id: z.string().optional(),
  customerId: z.string().min(1, 'Cliente é obrigatório'),
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  validUntil: z.string().optional(),
  estimatedDays: z.number().min(1).optional(),
  notes: z.string().optional(),
  status: z.enum(['draft', 'sent', 'approved', 'rejected', 'cancelled']),
  items: z.array(quoteItemSchema).min(1, 'Adicione pelo menos um item'),
})

export type QuoteInput = z.infer<typeof quoteSchema>

export const jobSchema = z.object({
  id: z.string().optional(),
  customerId: z.string().min(1, 'Cliente é obrigatório'),
  quoteId: z.string().optional(),
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  status: z.enum(['waiting', 'in_progress', 'ready', 'delivery_scheduled', 'completed', 'cancelled']),
  totalAmountCents: z.number().min(0),
})

export type JobInput = z.infer<typeof jobSchema>

export const materialSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Nome é obrigatório'),
  unit: z.enum(['unidade', 'chapa', 'metro', 'm²', 'caixa', 'pacote', 'litro', 'kg', 'rolo', 'outro']),
  currentQuantity: z.number().min(0),
  minimumQuantity: z.number().min(0).optional(),
  notes: z.string().optional(),
})

export type MaterialInput = z.infer<typeof materialSchema>

export const materialVariantSchema = z.object({
  id: z.string().optional(),
  materialId: z.string().min(1, 'Material é obrigatório'),
  label: z.string().min(1, 'Descrição da variante é obrigatória'),
})

export type MaterialVariantInput = z.infer<typeof materialVariantSchema>

export const jobMaterialSchema = z.object({
  id: z.string().optional(),
  materialId: z.string().min(1, 'Material é obrigatório'),
  variantId: z.string().optional(),
  quantity: z.number().min(0.01, 'Quantidade deve ser maior que zero'),
})

export type JobMaterialInput = z.infer<typeof jobMaterialSchema>

export const stockMovementSchema = z.object({
  materialId: z.string().min(1, 'Material é obrigatório'),
  variantId: z.string().optional(),
  jobId: z.string().optional(),
  quantity: z.number(),
  movementType: z.enum(['entry', 'exit', 'adjustment']),
  note: z.string().optional(),
})

export type StockMovementInput = z.infer<typeof stockMovementSchema>

export const receivableSchema = z.object({
  id: z.string().optional(),
  customerId: z.string().min(1, 'Cliente é obrigatório'),
  quoteId: z.string().optional(),
  jobId: z.string().optional(),
  description: z.string().min(1, 'Descrição é obrigatória'),
  amountCents: z.number().min(0.01, 'Valor deve ser maior que zero'),
  dueDate: z.string().min(1, 'Data de vencimento é obrigatória'),
  status: z.enum(['pending', 'received', 'overdue']),
})

export type ReceivableInput = z.infer<typeof receivableSchema>

export const companySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Nome da empresa é obrigatório'),
  responsibleName: z.string().optional(),
  phone: z.string().optional(),
  businessType: z.string().optional(),
})

export type CompanyInput = z.infer<typeof companySchema>
