import { createFileRoute } from '@tanstack/react-router'
import React, { useState, useEffect } from 'react'
import { Plus, CircleDollarSign, MessageCircle, Check, Trash2, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth'
import { getReceivables, getCustomers, getJobs, getQuotes } from '@/lib/queries'
import { createReceivable, markReceivableAsReceived, deleteReceivable } from '@/lib/mutations'
import { receivableSchema } from '@/lib/schemas'
import { formatCurrency, formatDate, formatWhatsAppLink } from '@/lib/formatters'
import { toast } from 'sonner'
import type { ReceivableInput } from '@/lib/schemas'

export const Route = createFileRoute('/app/a-receber')({
  head: () => ({ meta: [{ title: 'A receber · ORDO' }] }),
  component: ReceivablesPage,
})

function ReceivablesPage() {
  const { company } = useAuth()
  const [receivables, setReceivables] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [jobs, setJobs] = useState<any[]>([])
  const [quotes, setQuotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState<ReceivableInput>({
    customerId: '',
    quoteId: undefined,
    jobId: undefined,
    description: '',
    amountCents: 0,
    dueDate: '',
    status: 'pending',
  })

  const loadReceivables = async () => {
    if (!company) return
    setLoading(true)
    try {
      const data = await getReceivables(company.id)
      setReceivables(data)
    } catch (error) {
      console.error('Error loading receivables:', error)
      toast.error('Erro ao carregar recebíveis')
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

  const loadJobs = async () => {
    if (!company) return
    try {
      const data = await getJobs(company.id)
      setJobs(data)
    } catch (error) {
      console.error('Error loading jobs:', error)
    }
  }

  const loadQuotes = async () => {
    if (!company) return
    try {
      const data = await getQuotes(company.id)
      setQuotes(data)
    } catch (error) {
      console.error('Error loading quotes:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!company) return

    try {
      const validatedData = receivableSchema.parse(formData)
      await createReceivable(validatedData, company.id)
      toast.success('Recebível criado com sucesso')
      setShowModal(false)
      setFormData({
        customerId: '',
        quoteId: undefined,
        jobId: undefined,
        description: '',
        amountCents: 0,
        dueDate: '',
        status: 'pending',
      })
      loadReceivables()
    } catch (error) {
      console.error('Error saving receivable:', error)
      toast.error('Erro ao salvar recebível')
    }
  }

  const handleMarkAsReceived = async (id: string) => {
    if (!company) return
    if (!confirm('Marcar este recebível como recebido?')) return

    try {
      await markReceivableAsReceived(id, company.id)
      toast.success('Recebível marcado como recebido')
      loadReceivables()
    } catch (error) {
      console.error('Error marking receivable as received:', error)
      toast.error('Erro ao marcar recebível')
    }
  }

  const handleDelete = async (id: string) => {
    if (!company) return
    if (!confirm('Tem certeza que deseja excluir este recebível?')) return

    try {
      await deleteReceivable(id, company.id)
      toast.success('Recebível excluído com sucesso')
      loadReceivables()
    } catch (error) {
      console.error('Error deleting receivable:', error)
      toast.error('Erro ao excluir recebível')
    }
  }

  const handleWhatsApp = (receivable: any) => {
    const customer = customers.find(c => c.id === receivable.customerId)
    if (!customer?.phone) {
      toast.error('Cliente não possui telefone cadastrado')
      return
    }

    const message = `Olá ${customer.name}! Tudo bem?\n\nPassando para lembrar que o saldo de ${formatCurrency(Number(receivable.amountCents))} referente à ${receivable.description} vence em ${formatDate(receivable.dueDate)}.\n\nAguardo retorno.`
    const link = formatWhatsAppLink(customer.phone, message)
    window.open(link, '_blank')
  }

  useEffect(() => {
    if (company) {
      loadReceivables()
      loadCustomers()
      loadJobs()
      loadQuotes()
    }
  }, [company])

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-10">
        <div className="text-center">Carregando...</div>
      </div>
    )
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const overdue = receivables.filter(r => {
    const dueDate = new Date(r.dueDate)
    dueDate.setHours(0, 0, 0, 0)
    return r.status === 'pending' && dueDate < today
  })

  const todayReceivables = receivables.filter(r => {
    const dueDate = new Date(r.dueDate)
    dueDate.setHours(0, 0, 0, 0)
    return r.status === 'pending' && dueDate.getTime() === today.getTime()
  })

  const next7Days = receivables.filter(r => {
    const dueDate = new Date(r.dueDate)
    dueDate.setHours(0, 0, 0, 0)
    const nextWeek = new Date(today)
    nextWeek.setDate(nextWeek.getDate() + 7)
    return r.status === 'pending' && dueDate > today && dueDate <= nextWeek
  })

  const future = receivables.filter(r => {
    const dueDate = new Date(r.dueDate)
    dueDate.setHours(0, 0, 0, 0)
    const nextWeek = new Date(today)
    nextWeek.setDate(nextWeek.getDate() + 7)
    return r.status === 'pending' && dueDate > nextWeek
  })

  const totalOverdue = overdue.reduce((sum, r) => sum + Number(r.amountCents), 0)
  const totalToday = todayReceivables.reduce((sum, r) => sum + Number(r.amountCents), 0)
  const totalNext7Days = next7Days.reduce((sum, r) => sum + Number(r.amountCents), 0)
  const totalFuture = future.reduce((sum, r) => sum + Number(r.amountCents), 0)

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700',
    received: 'bg-green-100 text-green-700',
    overdue: 'bg-red-100 text-red-700',
  }

  const statusLabels = {
    pending: 'Pendente',
    received: 'Recebido',
    overdue: 'Atrasado',
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-10">
      <div>
        <p className="text-sm text-primary">Dinheiro dos trabalhos</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">A receber</h1>
        <p className="mt-1 text-sm text-muted-foreground">Sem financeiro complicado: só o que seus clientes devem.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Summary label="Vencidos" value={formatCurrency(totalOverdue)} count={overdue.length} tone="red" />
        <Summary label="Hoje" value={formatCurrency(totalToday)} count={todayReceivables.length} tone="yellow" />
        <Summary label="Próximos 7 dias" value={formatCurrency(totalNext7Days)} count={next7Days.length} tone="blue" />
        <Summary label="Futuros" value={formatCurrency(totalFuture)} count={future.length} tone="gray" />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Todos os recebíveis</h2>
        <Button onClick={() => setShowModal(true)}>
          <Plus /> Novo recebível
        </Button>
      </div>

      {receivables.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 p-10 text-center">
            <div className="rounded-full bg-primary/10 p-4 text-primary">
              <CircleDollarSign />
            </div>
            <h2 className="text-lg font-semibold">Nenhum recebível cadastrado</h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              Ao aprovar um orçamento, defina a entrada e as parcelas do trabalho.
            </p>
            <Button onClick={() => setShowModal(true)} variant="outline">
              <Plus /> Adicionar recebível
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {overdue.length > 0 && (
            <Section title="Vencidos" items={overdue} customers={customers} statusColors={statusColors} statusLabels={statusLabels} onMarkAsReceived={handleMarkAsReceived} onWhatsApp={handleWhatsApp} onDelete={handleDelete} />
          )}
          {todayReceivables.length > 0 && (
            <Section title="Hoje" items={todayReceivables} customers={customers} statusColors={statusColors} statusLabels={statusLabels} onMarkAsReceived={handleMarkAsReceived} onWhatsApp={handleWhatsApp} onDelete={handleDelete} />
          )}
          {next7Days.length > 0 && (
            <Section title="Próximos 7 dias" items={next7Days} customers={customers} statusColors={statusColors} statusLabels={statusLabels} onMarkAsReceived={handleMarkAsReceived} onWhatsApp={handleWhatsApp} onDelete={handleDelete} />
          )}
          {future.length > 0 && (
            <Section title="Futuros" items={future} customers={customers} statusColors={statusColors} statusLabels={statusLabels} onMarkAsReceived={handleMarkAsReceived} onWhatsApp={handleWhatsApp} onDelete={handleDelete} />
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/35 p-3 overflow-y-auto">
          <Card className="w-full max-w-2xl my-8">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold">Novo recebível</h2>
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quoteId">Orçamento (opcional)</Label>
                    <select
                      id="quoteId"
                      value={formData.quoteId || ''}
                      onChange={(e) => setFormData({ ...formData, quoteId: e.target.value || undefined })}
                      className="mt-2 h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Selecione um orçamento</option>
                      {quotes.map((quote) => (
                        <option key={quote.id} value={quote.id}>
                          {quote.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="jobId">Trabalho (opcional)</Label>
                    <select
                      id="jobId"
                      value={formData.jobId || ''}
                      onChange={(e) => setFormData({ ...formData, jobId: e.target.value || undefined })}
                      className="mt-2 h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Selecione um trabalho</option>
                      {jobs.map((job) => (
                        <option key={job.id} value={job.id}>
                          {job.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Descrição *</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="amountCents">Valor (R$) *</Label>
                    <Input
                      id="amountCents"
                      type="number"
                      value={formData.amountCents / 100}
                      onChange={(e) => setFormData({ ...formData, amountCents: Math.round(Number(e.target.value) * 100) })}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="dueDate">Data de vencimento *</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    Criar recebível
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowModal(false)
                      setFormData({
                        customerId: '',
                        quoteId: undefined,
                        jobId: undefined,
                        description: '',
                        amountCents: 0,
                        dueDate: '',
                        status: 'pending',
                      })
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

function Summary({ label, value, count, tone }: { label: string; value: string; count: number; tone: 'red' | 'yellow' | 'blue' | 'gray' }) {
  const colors = {
    red: 'border-red-500/30 bg-red-50/70 dark:bg-red-950/20',
    yellow: 'border-yellow-500/30 bg-yellow-50/70 dark:bg-yellow-950/20',
    blue: 'border-blue-500/30 bg-blue-50/70 dark:bg-blue-950/20',
    gray: 'border-gray-500/30 bg-gray-50/70 dark:bg-gray-950/20',
  }
  return (
    <Card className={colors[tone]}>
      <CardContent className="p-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="mt-2 text-xl font-semibold">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{count} item(ns)</p>
      </CardContent>
    </Card>
  )
}

function Section({ 
  title, 
  items, 
  customers, 
  statusColors, 
  statusLabels, 
  onMarkAsReceived, 
  onWhatsApp, 
  onDelete 
}: { 
  title: string
  items: any[]
  customers: any[]
  statusColors: any
  statusLabels: any
  onMarkAsReceived: (id: string) => void
  onWhatsApp: (receivable: any) => void
  onDelete: (id: string) => void
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold mb-2">{title}</h3>
      <div className="space-y-2">
        {items.map((receivable) => {
          const customer = customers.find(c => c.id === receivable.customerId)
          const status = receivable.status === 'pending' && new Date(receivable.dueDate) < new Date() ? 'overdue' : receivable.status
          return (
            <Card key={receivable.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{receivable.description}</h4>
                      <span className={`rounded-full px-2 py-0.5 text-xs ${statusColors[status]}`}>
                        {statusLabels[status]}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {customer?.name || 'Cliente não encontrado'}
                    </p>
                    <div className="mt-2 flex items-center gap-4">
                      <p className="text-lg font-semibold">
                        {formatCurrency(Number(receivable.amountCents))}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Vence: {formatDate(receivable.dueDate)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {receivable.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onWhatsApp(receivable)}
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onMarkAsReceived(receivable.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onDelete(receivable.id)}
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
    </div>
  )
}
