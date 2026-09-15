import { createFileRoute } from '@tanstack/react-router'
import React, { useState, useEffect } from 'react'
import { Plus, Hammer, Edit, Trash2, Package, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth'
import { getJobs, getCustomers, getMaterials, getJobMaterials } from '@/lib/queries'
import { createJob, updateJob, updateJobStatus, deleteJob, addJobMaterial, updateJobMaterial, deleteJobMaterial } from '@/lib/mutations'
import { jobSchema, jobMaterialSchema } from '@/lib/schemas'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { toast } from 'sonner'
import type { JobInput, JobMaterialInput } from '@/lib/schemas'

export const Route = createFileRoute('/app/trabalhos')({
  head: () => ({ meta: [{ title: 'Trabalhos · Ordem Simples' }] }),
  component: JobsPage,
})

function JobsPage() {
  const { company } = useAuth()
  const [jobs, setJobs] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [materials, setMaterials] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showMaterialsModal, setShowMaterialsModal] = useState(false)
  const [editingJob, setEditingJob] = useState<any | null>(null)
  const [selectedJob, setSelectedJob] = useState<any | null>(null)
  const [jobMaterials, setJobMaterials] = useState<JobMaterialInput[]>([])
  const [formData, setFormData] = useState<JobInput>({
    customerId: '',
    quoteId: undefined,
    title: '',
    description: '',
    dueDate: '',
    status: 'waiting',
    totalAmountCents: 0,
  })

  const loadJobs = async () => {
    if (!company) return
    setLoading(true)
    try {
      const data = await getJobs(company.id)
      setJobs(data)
    } catch (error) {
      console.error('Error loading jobs:', error)
      toast.error('Erro ao carregar trabalhos')
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

  const loadMaterials = async () => {
    if (!company) return
    try {
      const data = await getMaterials(company.id)
      setMaterials(data)
    } catch (error) {
      console.error('Error loading materials:', error)
    }
  }

  const loadJobMaterials = async (jobId: string) => {
    if (!company) return
    try {
      const data = await getJobMaterials(jobId, company.id)
      setJobMaterials(data.map((item: any) => ({
        materialId: item.materialId,
        variantId: item.variantId || undefined,
        quantity: Number(item.quantity),
      })))
    } catch (error) {
      console.error('Error loading job materials:', error)
    }
  }

  const addMaterial = () => {
    setJobMaterials([...jobMaterials, {
      materialId: '',
      variantId: undefined,
      quantity: 1,
    }])
  }

  const updateMaterial = (index: number, field: keyof JobMaterialInput, value: any) => {
    const newMaterials = [...jobMaterials]
    newMaterials[index] = { ...newMaterials[index], [field]: value }
    setJobMaterials(newMaterials)
  }

  const removeMaterial = (index: number) => {
    setJobMaterials(jobMaterials.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!company) return

    try {
      const validatedData = jobSchema.parse(formData)
      
      if (editingJob) {
        await updateJob(editingJob.id, validatedData, company.id)
        toast.success('Trabalho atualizado com sucesso')
      } else {
        await createJob(validatedData, company.id)
        toast.success('Trabalho criado com sucesso')
      }
      
      setShowModal(false)
      setEditingJob(null)
      setFormData({
        customerId: '',
        quoteId: undefined,
        title: '',
        description: '',
        dueDate: '',
        status: 'waiting',
        totalAmountCents: 0,
      })
      loadJobs()
    } catch (error) {
      console.error('Error saving job:', error)
      toast.error('Erro ao salvar trabalho')
    }
  }

  const handleEdit = (job: any) => {
    setEditingJob(job)
    setFormData({
      customerId: job.customerId,
      quoteId: job.quoteId || undefined,
      title: job.title,
      description: job.description || '',
      dueDate: job.dueDate || '',
      status: job.status,
      totalAmountCents: Number(job.totalAmountCents),
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!company) return
    if (!confirm('Tem certeza que deseja excluir este trabalho?')) return

    try {
      await deleteJob(id, company.id)
      toast.success('Trabalho excluído com sucesso')
      loadJobs()
    } catch (error) {
      console.error('Error deleting job:', error)
      toast.error('Erro ao excluir trabalho')
    }
  }

  const handleStatusChange = async (id: string, status: string) => {
    if (!company) return
    try {
      await updateJobStatus(id, status, company.id)
      toast.success('Status atualizado com sucesso')
      loadJobs()
    } catch (error) {
      console.error('Error updating job status:', error)
      toast.error('Erro ao atualizar status')
    }
  }

  const handleManageMaterials = (job: any) => {
    setSelectedJob(job)
    loadJobMaterials(job.id)
    setShowMaterialsModal(true)
  }

  const handleSaveMaterials = async () => {
    if (!company || !selectedJob) return

    try {
      for (const material of jobMaterials) {
        if (material.materialId) {
          const validated = jobMaterialSchema.parse(material)
          await addJobMaterial(selectedJob.id, validated, company.id)
        }
      }
      toast.success('Materiais atualizados com sucesso')
      setShowMaterialsModal(false)
      setSelectedJob(null)
      setJobMaterials([])
    } catch (error) {
      console.error('Error saving job materials:', error)
      toast.error('Erro ao salvar materiais')
    }
  }

  useEffect(() => {
    if (company) {
      loadJobs()
      loadCustomers()
      loadMaterials()
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
    waiting: 'bg-yellow-100 text-yellow-700',
    in_progress: 'bg-blue-100 text-blue-700',
    ready: 'bg-green-100 text-green-700',
    delivery_scheduled: 'bg-purple-100 text-purple-700',
    completed: 'bg-gray-100 text-gray-700',
    cancelled: 'bg-red-100 text-red-700',
  }

  const statusLabels = {
    waiting: 'Aguardando',
    in_progress: 'Em andamento',
    ready: 'Pronto',
    delivery_scheduled: 'Entrega agendada',
    completed: 'Concluído',
    cancelled: 'Cancelado',
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-10">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-primary">Agenda</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Trabalhos</h1>
          <p className="mt-1 text-sm text-muted-foreground">Acompanhe o que precisa ser feito e entregue.</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus /> Novo trabalho
        </Button>
      </div>

      {jobs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 p-10 text-center">
            <div className="rounded-full bg-primary/10 p-4 text-primary">
              <Hammer />
            </div>
            <h2 className="text-lg font-semibold">Seus trabalhos aparecem aqui</h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              Aprove um orçamento ou crie um trabalho direto para começar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {jobs.map((job) => {
            const customer = customers.find(c => c.id === job.customerId)
            return (
              <Card key={job.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{job.title}</h3>
                        <span className={`rounded-full px-2 py-0.5 text-xs ${statusColors[job.status as keyof typeof statusColors]}`}>
                          {statusLabels[job.status as keyof typeof statusLabels]}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {customer?.name || 'Cliente não encontrado'}
                      </p>
                      {job.dueDate && (
                        <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(job.dueDate)}
                        </p>
                      )}
                      {job.totalAmountCents > 0 && (
                        <p className="mt-2 text-lg font-semibold">
                          {formatCurrency(Number(job.totalAmountCents))}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleManageMaterials(job)}
                      >
                        <Package className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(job)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(job.id)}
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
                {editingJob ? 'Editar trabalho' : 'Novo trabalho'}
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
                    <Label htmlFor="dueDate">Data de entrega</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <select
                      id="status"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="mt-2 h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="waiting">Aguardando</option>
                      <option value="in_progress">Em andamento</option>
                      <option value="ready">Pronto</option>
                      <option value="delivery_scheduled">Entrega agendada</option>
                      <option value="completed">Concluído</option>
                      <option value="cancelled">Cancelado</option>
                    </select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="totalAmountCents">Valor total (R$)</Label>
                  <Input
                    id="totalAmountCents"
                    type="number"
                    value={formData.totalAmountCents / 100}
                    onChange={(e) => setFormData({ ...formData, totalAmountCents: Math.round(Number(e.target.value) * 100) })}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    {editingJob ? 'Atualizar' : 'Criar'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowModal(false)
                      setEditingJob(null)
                      setFormData({
                        customerId: '',
                        quoteId: undefined,
                        title: '',
                        description: '',
                        dueDate: '',
                        status: 'waiting',
                        totalAmountCents: 0,
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

      {showMaterialsModal && selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/35 p-3 overflow-y-auto">
          <Card className="w-full max-w-2xl my-8">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold">Materiais necessários</h2>
              <p className="text-sm text-muted-foreground">{selectedJob.title}</p>
              
              <div className="mt-4 space-y-2">
                {jobMaterials.map((material, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <div className="flex-1">
                      <select
                        value={material.materialId}
                        onChange={(e) => updateMaterial(index, 'materialId', e.target.value)}
                        className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="">Selecione um material</option>
                        {materials.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                      <Input
                        type="number"
                        placeholder="Quantidade"
                        value={material.quantity}
                        onChange={(e) => updateMaterial(index, 'quantity', Number(e.target.value))}
                        min="0.01"
                        step="0.01"
                        className="mt-2"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeMaterial(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addMaterial}
                  className="w-full"
                >
                  <Plus /> Adicionar material
                </Button>
              </div>

              <div className="mt-4 flex gap-2">
                <Button onClick={handleSaveMaterials} className="flex-1">
                  Salvar materiais
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowMaterialsModal(false)
                    setSelectedJob(null)
                    setJobMaterials([])
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
