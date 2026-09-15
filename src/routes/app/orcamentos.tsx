import { createFileRoute } from '@tanstack/react-router'
import React, { useState, useEffect } from 'react'
import { Plus, Send, Check, X, FileText, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth'
import { getQuotes, getQuoteItems, getCustomers } from '@/lib/queries'
import { createQuote, updateQuote, updateQuoteStatus, deleteQuote, approveQuoteAndCreateJob } from '@/lib/mutations'
import { quoteSchema, quoteItemSchema } from '@/lib/schemas'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { toast } from 'sonner'
import type { QuoteInput, QuoteItemInput } from '@/lib/schemas'

export const Route = createFileRoute('/app/orcamentos')({
  head: () => ({ meta: [{ title: 'Orçamentos · Ordem Simples' }] }),
  component: QuotesPage,
})

function QuotesPage() {
  const { company } = useAuth()
  const [quotes, setQuotes] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingApproval, setLoadingApproval] = useState<Record<string, boolean>>({})
  const [loadingStatus, setLoadingStatus] = useState<Record<string, boolean>>({})
  const [showModal, setShowModal] = useState(false)
  const [editingQuote, setEditingQuote] = useState<any | null>(null)
  const [quoteItems, setQuoteItems] = useState<QuoteItemInput[]>([])
  const [formData, setFormData] = useState<QuoteInput>({
    customerId: '',
    title: '',
    description: '',
    validUntil: '',
    estimatedDays: undefined,
    notes: '',
    status: 'draft',
    items: [],
  })

  const loadQuotes = async () => {
    if (!company) return
    setLoading(true)
    try {
      const data = await getQuotes(company.id)
      setQuotes(data)
    } catch (error) {
      console.error('Error loading quotes:', error)
      toast.error('Erro ao carregar orçamentos')
    } finally {
      setLoading(false)
    }
  }

  const loadCustomers = async () => {
    if (!company) return
    try {
      const data = await getCustomers(company.id)
      setCustomers(data)
    } catch (error) {
      console.error('Error loading customers:', error)
    }
  }

  const addItem = () => {
    setQuoteItems([...quoteItems, {
      description: '',
      quantity: 1,
      unitPriceCents: 0,
    }])
  }

  const updateItem = (index: number, field: keyof QuoteItemInput, value: any) => {
    const newItems = [...quoteItems]
    newItems[index] = { ...newItems[index], [field]: value }
    setQuoteItems(newItems)
  }

  const removeItem = (index: number) => {
    setQuoteItems(quoteItems.filter((_, i) => i !== index))
  }

  const calculateTotal = () => {
    return quoteItems.reduce((sum, item) => sum + (item.quantity * item.unitPriceCents), 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!company) return

    try {
      const validatedData = quoteSchema.parse({
        ...formData,
        items: quoteItems,
      })
      
      if (editingQuote) {
        await updateQuote(editingQuote.id, validatedData, company.id)
        toast.success('Orçamento atualizado com sucesso')
      } else {
        await createQuote(validatedData, company.id)
        toast.success('Orçamento criado com sucesso')
      }
      
      setShowModal(false)
      setEditingQuote(null)
      setFormData({
        customerId: '',
        title: '',
        description: '',
        validUntil: '',
        estimatedDays: undefined,
        notes: '',
        status: 'draft',
        items: [],
      })
      setQuoteItems([])
      loadQuotes()
    } catch (error) {
      console.error('Error saving quote:', error)
      toast.error('Erro ao salvar orçamento')
    }
  }

  const handleEdit = async (quote: any) => {
    try {
      const items = await getQuoteItems(quote.id, company.id)
      setEditingQuote(quote)
      setFormData({
        customerId: quote.customerId,
        title: quote.title,
        description: quote.description || '',
        validUntil: quote.validUntil || '',
        estimatedDays: quote.estimatedDays ? Number(quote.estimatedDays) : undefined,
        notes: quote.notes || '',
        status: quote.status,
        items: [],
      })
      setQuoteItems(items.map((item: any) => ({
        description: item.description,
        quantity: Number(item.quantity),
        unitPriceCents: Number(item.unitPriceCents),
      })))
      setShowModal(true)
    } catch (error) {
      console.error('Error loading quote items:', error)
      toast.error('Erro ao carregar itens do orçamento')
    }
  }

  const handleDelete = async (id: string) => {
    if (!company) return
    if (!confirm('Tem certeza que deseja excluir este orçamento?')) return

    try {
      await deleteQuote(id, company.id)
      toast.success('Orçamento excluído com sucesso')
      loadQuotes()
    } catch (error) {
      console.error('Error deleting quote:', error)
      toast.error('Erro ao excluir orçamento')
    }
  }

  const handleStatusChange = async (id: string, status: string) => {
    if (!company) return
    if (loadingStatus[id]) return

    setLoadingStatus(prev => ({ ...prev, [id]: true }))

    try {
      await updateQuoteStatus(id, status, company.id)
      toast.success('Status atualizado com sucesso')
      loadQuotes()
    } catch (error) {
      console.error('Error updating quote status:', error)
      toast.error('Erro ao atualizar status')
    } finally {
      setLoadingStatus(prev => ({ ...prev, [id]: false }))
    }
  }

  const handleApprove = async (quote: any) => {
    if (!company) return
    if (loadingApproval[quote.id]) return
    if (!confirm('Deseja aprovar este orçamento e criar um trabalho?')) return

    setLoadingApproval(prev => ({ ...prev, [quote.id]: true }))

    try {
      await approveQuoteAndCreateJob(quote.id, company.id)
      toast.success('Orçamento aprovado e trabalho criado')
      loadQuotes()
    } catch (error) {
      console.error('Error approving quote:', error)
      toast.error('Erro ao aprovar orçamento')
    } finally {
      setLoadingApproval(prev => ({ ...prev, [quote.id]: false }))
    }
  }

  useEffect(() => {
    if (company) {
      loadQuotes()
      loadCustomers()
    }
  }, [company])

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-10">
        <div className="text-center">Carregando...</div>
      </div>
    )
  }

  const statusColors = {
    draft: 'bg-gray-100 text-gray-700',
    sent: 'bg-blue-100 text-blue-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-700',
  }

  const statusLabels = {
    draft: 'Rascunho',
    sent: 'Enviado',
    approved: 'Aprovado',
    rejected: 'Rejeitado',
    cancelled: 'Cancelado',
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-10">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-primary">Orçamentos</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Orçamentos</h1>
          <p className="mt-1 text-sm text-muted-foreground">Propostas claras para seus próximos trabalhos.</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus /> Novo orçamento
        </Button>
      </div>

      {quotes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 p-10 text-center">
            <div className="rounded-full bg-primary/10 p-4 text-primary">
              <FileText />
            </div>
            <h2 className="text-lg font-semibold">Comece por um orçamento</h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              Cadastre cliente, itens e valor. Quando ele aprovar, transforme em trabalho.
            </p>
            <Button onClick={() => setShowModal(true)} variant="outline">
              <Send /> Criar primeiro orçamento
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {quotes.map((quote) => {
            const customer = customers.find(c => c.id === quote.customerId)
            return (
              <Card key={quote.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{quote.title}</h3>
                        <span className={`rounded-full px-2 py-0.5 text-xs ${statusColors[quote.status as keyof typeof statusColors]}`}>
                          {statusLabels[quote.status as keyof typeof statusLabels]}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {customer?.name || 'Cliente não encontrado'}
                      </p>
                      <p className="mt-2 text-lg font-semibold">
                        {formatCurrency(Number(quote.totalAmountCents))}
                      </p>
                      {quote.validUntil && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Válido até: {formatDate(quote.validUntil)}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {quote.status === 'draft' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(quote.id, 'sent')}
                            disabled={loadingStatus[quote.id]}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApprove(quote)}
                            disabled={loadingApproval[quote.id]}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {quote.status === 'sent' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApprove(quote)}
                            disabled={loadingApproval[quote.id]}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(quote.id, 'rejected')}
                            disabled={loadingStatus[quote.id]}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(quote)}
                        disabled={quote.status !== 'draft'}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(quote.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/35 p-3 overflow-y-auto">
          <Card className="w-full max-w-2xl my-8">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold">
                {editingQuote ? 'Editar orçamento' : 'Novo orçamento'}
              </h2>
              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <div>
                  <Label htmlFor="customerId">Cliente *</Label>
                  <select
                    id="customerId"
                    value={formData.customerId}
                    onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                    className="mt-2 h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                    required
                  >
                    <option value="">Selecione um cliente</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="validUntil">Válido até</Label>
                    <Input
                      id="validUntil"
                      type="date"
                      value={formData.validUntil}
                      onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="estimatedDays">Prazo estimado (dias)</Label>
                    <Input
                      id="estimatedDays"
                      type="number"
                      value={formData.estimatedDays || ''}
                      onChange={(e) => setFormData({ ...formData, estimatedDays: e.target.value ? Number(e.target.value) : undefined })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Itens do orçamento *</Label>
                  <div className="mt-2 space-y-2">
                    {quoteItems.map((item, index) => (
                      <div key={index} className="flex gap-2 items-start">
                        <div className="flex-1">
                          <Input
                            placeholder="Descrição"
                            value={item.description}
                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                            className="mb-2"
                          />
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              placeholder="Qtd"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                              min="0.01"
                              step="0.01"
                            />
                            <Input
                              type="number"
                              placeholder="Preço (R$)"
                              value={item.unitPriceCents / 100}
                              onChange={(e) => updateItem(index, 'unitPriceCents', Math.round(Number(e.target.value) * 100))}
                              min="0"
                              step="0.01"
                            />
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeItem(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addItem}
                      className="w-full"
                    >
                      <Plus /> Adicionar item
                    </Button>
                  </div>
                </div>
                {quoteItems.length > 0 && (
                  <div className="text-right">
                    <p className="text-lg font-semibold">
                      Total: {formatCurrency(calculateTotal())}
                    </p>
                  </div>
                )}
                <div>
                  <Label htmlFor="notes">Observações</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    className="flex-1"
                    disabled={quoteItems.length === 0}
                  >
                    {editingQuote ? 'Atualizar' : 'Criar'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowModal(false)
                      setEditingQuote(null)
                      setFormData({
                        customerId: '',
                        title: '',
                        description: '',
                        validUntil: '',
                        estimatedDays: undefined,
                        notes: '',
                        status: 'draft',
                        items: [],
                      })
                      setQuoteItems([])
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
