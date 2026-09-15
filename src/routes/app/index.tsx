import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  Hammer,
  PackageSearch,
  Plus,
  ShoppingCart,
  UserRound,
  WalletCards,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth'
import { getJobs, getCustomers, getMaterials, getJobMaterials, getReceivables, getMaterialVariants } from '@/lib/queries'
import { createJob, createStockMovement, markReceivableAsReceived } from '@/lib/mutations'
import { calculateStockFuture } from '@/lib/stock-future'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { jobSchema } from '@/lib/schemas'

export const Route = createFileRoute('/app/')({
  head: () => ({
    meta: [
      { title: 'Hoje · Ordem Simples' },
      { name: 'description', content: 'Do orçamento à entrega, sem perder prazo, material ou dinheiro.' },
    ],
  }),
  component: TodayPage,
})

function TodayPage() {
  const { user, company } = useAuth()
  const [jobs, setJobs] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [materials, setMaterials] = useState<any[]>([])
  const [materialVariants, setMaterialVariants] = useState<any[]>([])
  const [jobMaterials, setJobMaterials] = useState<any[]>([])
  const [receivables, setReceivables] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [stockRequirements, setStockRequirements] = useState<any[]>([])

  const loadData = async () => {
    if (!company) return
    setLoading(true)
    try {
      const [jobsData, customersData, materialsData, materialVariantsData, jobMaterialsData, receivablesData] = await Promise.all([
        getJobs(company.id),
        getCustomers(company.id),
        getMaterials(company.id),
        getMaterialVariants(company.id),
        Promise.all((await getJobs(company.id)).map(job => getJobMaterials(job.id, company.id))).then(results => results.flat()),
        getReceivables(company.id),
      ])
      
      setJobs(jobsData)
      setCustomers(customersData)
      setMaterials(materialsData)
      setMaterialVariants(materialVariantsData)
      setJobMaterials(jobMaterialsData)
      setReceivables(receivablesData)

      const stockCalc = calculateStockFuture(materialsData, jobsData, jobMaterialsData, materialVariantsData)
      setStockRequirements(stockCalc.requirements)
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const activeJobs = jobs.filter(job => 
    job.status === 'waiting' || job.status === 'in_progress' || job.status === 'ready'
  )

  const pendingReceivables = receivables.filter(r => r.status === 'pending')
  const totalPending = pendingReceivables.reduce((sum, r) => sum + Number(r.amountCents), 0)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const urgentJobs = activeJobs.filter(job => {
    if (!job.dueDate) return false
    const dueDate = new Date(job.dueDate)
    dueDate.setHours(0, 0, 0, 0)
    const nextWeek = new Date(today)
    nextWeek.setDate(nextWeek.getDate() + 7)
    return dueDate <= nextWeek
  })

  function addJob() {
    if (!newTitle.trim() || !company) return
    
    createJob({
      customerId: customers[0]?.id || '',
      title: newTitle,
      description: '',
      dueDate: '',
      status: 'waiting',
      totalAmountCents: 0,
    }, company.id).then(() => {
      toast.success('Trabalho criado', { description: 'Agora você pode completar os materiais e a data.' })
      setNewTitle('')
      setShowNew(false)
      loadData()
    }).catch(error => {
      console.error('Error creating job:', error)
      toast.error('Erro ao criar trabalho')
    })
  }

  function markBought(requirement: any) {
    if (!company) return

    createStockMovement({
      materialId: requirement.materialId,
      variantId: requirement.variantId,
      quantity: requirement.missingQuantity,
      movementType: 'entry',
      note: `Compra para ${requirement.relatedJobs[0]?.jobTitle}`,
    }, company.id).then(() => {
      toast.success('Compra registrada', { description: `${requirement.materialName} adicionado ao estoque.` })
      loadData()
    }).catch(error => {
      console.error('Error registering purchase:', error)
      toast.error('Erro ao registrar compra')
    })
  }

  function markReceived(receivable: any) {
    if (!company) return

    markReceivableAsReceived(receivable.id, company.id).then(() => {
      toast.success('Recebimento marcado', { description: 'O saldo foi recebido.' })
      loadData()
    }).catch(error => {
      console.error('Error marking receivable:', error)
      toast.error('Erro ao marcar recebimento')
    })
  }

  useEffect(() => {
    if (company) {
      loadData()
    }
  }, [company])

  if (loading) {
    return (
      <div className="min-h-dvh bg-background pb-24 md:pb-8">
        <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 lg:px-10 lg:py-8">
          <div className="text-center">Carregando...</div>
        </div>
      </div>
    )
  }

  const userName = user?.displayName || user?.email?.split('@')[0] || 'Usuário'

  return (
    <div className="min-h-dvh bg-background pb-24 md:pb-8">
      <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 lg:px-10 lg:py-8">
        <header className="mb-7 flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              <span className="h-2 w-2 rounded-full bg-primary" /> Ordem Simples
            </p>
            <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Bom dia, {userName}.</h1>
            <p className="mt-1 text-sm text-muted-foreground">Aqui está o que merece sua atenção hoje.</p>
          </div>
          <Button onClick={() => setShowNew(true)} className="hidden shrink-0 sm:inline-flex">
            <Plus /> Novo trabalho
          </Button>
        </header>

        <section aria-labelledby="answers-title" className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="answers-title" className="text-sm font-semibold text-foreground">O que precisa de atenção?</h2>
            <span className="font-mono text-[11px] text-muted-foreground">{new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}</span>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <AnswerCard icon={<Hammer />} label="Preciso fazer" value={`${activeJobs.length} trabalhos`} detail={`${urgentJobs.length} para os próximos 7 dias`} tone="primary" />
            <AnswerCard icon={<ShoppingCart />} label="Preciso comprar" value={stockRequirements.length > 0 ? `${stockRequirements.length} itens` : 'Tudo em dia'} detail={stockRequirements.length > 0 ? stockRequirements[0]?.materialName : 'Estoque atualizado'} tone={stockRequirements.length > 0 ? 'amber' : 'green'} />
            <AnswerCard icon={<WalletCards />} label="Preciso receber" value={totalPending > 0 ? formatCurrency(totalPending) : 'Tudo recebido'} detail={totalPending > 0 ? `${pendingReceivables.length} pendentes` : 'Nenhum saldo pendente'} tone={totalPending > 0 ? 'green' : 'green'} />
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
          <section aria-labelledby="jobs-title">
            <div className="mb-3 flex items-center justify-between"><div><h2 id="jobs-title" className="text-lg font-semibold">Trabalhos</h2><p className="text-sm text-muted-foreground">O que está na sua agenda.</p></div><a href="/app/trabalhos" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">Ver todos <ArrowRight className="size-4" /></a></div>
            <div className="space-y-3">
              {activeJobs.length === 0 ? (
                <Card><CardContent className="flex flex-col items-center justify-center gap-3 p-6 text-center"><p className="text-sm text-muted-foreground">Nenhum trabalho ativo no momento.</p></CardContent></Card>
              ) : (
                activeJobs.slice(0, 5).map(job => {
                  const customer = customers.find(c => c.id === job.customerId)
                  const jobMaterial = jobMaterials.filter(jm => jm.jobId === job.id)
                  const tone = jobMaterial.length === 0 ? 'warn' : 'ok'
                  const detail = jobMaterial.length === 0 ? 'Defina os materiais necessários' : `${jobMaterial.length} material(ais) separado(s)`
                  
                  return <JobCard job={{ ...job, customerName: customer?.name || 'Cliente não encontrado', detail, tone }} />
                })
              )}
            </div>
          </section>

          <div className="space-y-5">
            <section aria-labelledby="buy-title">
              <div className="mb-3 flex items-center justify-between"><div><h2 id="buy-title" className="text-lg font-semibold">Preciso comprar</h2><p className="text-sm text-muted-foreground">O estoque futuro não fecha.</p></div><PackageSearch className="size-5 text-primary" /></div>
              {stockRequirements.length === 0 ? (
                <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground text-center">Tudo certo por aqui.</p></CardContent></Card>
              ) : (
                stockRequirements.slice(0, 2).map(req => (
                  <Card key={req.materialId} className="border-amber-500/30 bg-amber-50/70 shadow-none dark:bg-amber-950/20 mb-3">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="rounded-full bg-amber-500/15 p-2 text-amber-700"><AlertTriangle className="size-4" /></div>
                        <div className="flex-1">
                          <p className="font-semibold">{req.missingQuantity} {req.materialName}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Necessário até {req.criticalDate ? formatDate(req.criticalDate) : 'data não definida'} · {req.relatedJobs[0]?.jobTitle}
                          </p>
                        </div>
                      </div>
                      <Button onClick={() => markBought(req)} variant="outline" className="mt-4 w-full bg-background">Comprei e adicionar ao estoque</Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </section>

            <section aria-labelledby="receivables-title">
              <div className="mb-3 flex items-center justify-between"><div><h2 id="receivables-title" className="text-lg font-semibold">A receber</h2><p className="text-sm text-muted-foreground">Dinheiro dos trabalhos.</p></div><CircleDollarSign className="size-5 text-primary" /></div>
              <Card className="shadow-none"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-wider text-muted-foreground">Saldo pendente</p><p className="mt-1 text-2xl font-semibold tabular-nums">{totalPending > 0 ? formatCurrency(totalPending) : 'R$ 0,00'}</p></div><div className="rounded-full bg-primary/10 p-3 text-primary"><WalletCards className="size-5" /></div></div>{pendingReceivables.length > 0 ? (
                <div className="mt-4 space-y-2">
                  {pendingReceivables.slice(0, 2).map(receivable => {
                    const customer = customers.find(c => c.id === receivable.customerId)
                    return (
                      <div key={receivable.id} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div>
                          <p className="text-sm font-medium">{customer?.name || 'Cliente'}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(receivable.dueDate)}</p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => markReceived(receivable)}>Receber</Button>
                      </div>
                    )
                  })}
                </div>
              ) : <p className="mt-3 text-sm text-emerald-700">Tudo certo por aqui.</p>}</CardContent></Card>
            </section>
          </div>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 px-2 py-2 backdrop-blur md:hidden"><div className="mx-auto grid max-w-md grid-cols-6 gap-1"><MobileNav icon={<CalendarDays />} label="Hoje" active /><MobileNav icon={<UserRound />} label="Clientes" /><MobileNav icon={<FileIcon />} label="Orçamentos" /><MobileNav icon={<Hammer />} label="Trabalhos" /><MobileNav icon={<PackageSearch />} label="Materiais" /><MobileNav icon={<WalletCards />} label="A receber" /></div></nav>

      {showNew && <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/35 p-3 sm:items-center"><div role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-lg"><div className="mb-5 flex items-center justify-between"><div><h2 className="text-lg font-semibold">Novo trabalho</h2><p className="text-sm text-muted-foreground">Comece pelo que você precisa entregar.</p></div><Button variant="ghost" size="icon" aria-label="Fechar" onClick={() => setShowNew(false)}><X /></Button></div><label className="text-sm font-medium" htmlFor="job-title">Nome do trabalho</label><input id="job-title" value={newTitle} onChange={event => setNewTitle(event.target.value)} placeholder="Ex.: Fachada da loja" className="mt-2 h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" autoFocus /><Button className="mt-4 w-full" onClick={addJob}>Criar trabalho</Button></div></div>}
    </div>
  )
}

function AnswerCard({ icon, label, value, detail, tone, onClick }: { icon: ReactNode; label: string; value: string; detail: string; tone: 'primary' | 'amber' | 'green'; onClick?: () => void }) {
  const colors = { primary: 'bg-primary text-primary-foreground', amber: 'bg-amber-500 text-amber-950', green: 'bg-emerald-600 text-emerald-50' }
  return <button type="button" onClick={onClick} className="group rounded-xl text-left transition-transform hover:-translate-y-0.5 active:scale-[0.98]" disabled={!onClick}><Card className="h-full border-border/80 shadow-sm transition-shadow group-hover:shadow-md"><CardContent className="p-4"><div className="flex items-start justify-between gap-3"><div className={`rounded-lg p-2 ${colors[tone]}`}>{icon}</div>{onClick && <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />}</div><p className="mt-4 text-sm text-muted-foreground">{label}</p><p className="mt-1 text-xl font-semibold tracking-tight">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></CardContent></Card></button>
}

function JobCard({ job }: { job: any }) { 
  return <Card className="shadow-none transition-shadow hover:shadow-sm"><CardContent className="flex items-center gap-3 p-4"><div className={`h-10 w-1 rounded-full ${job.tone === 'warn' ? 'bg-amber-500' : 'bg-emerald-600'}`} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-x-2 gap-y-1"><h3 className="font-semibold">{job.title}</h3>{job.dueDate && <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{formatDate(job.dueDate)}</span>}</div><p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><UserRound className="size-3.5" /> {job.customerName}</p><p className={`mt-2 text-xs ${job.tone === 'warn' ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}`}>{job.tone === 'warn' ? '⚠ ' : '✔ '}{job.detail}</p></div><ChevronRight className="size-5 shrink-0 text-muted-foreground" /></CardContent></Card> 
}

function MobileNav({ icon, label, active }: { icon: ReactNode; label: string; active?: boolean }) { 
  const hrefMap: Record<string, string> = {
    'Hoje': '/app',
    'Clientes': '/app/clientes',
    'Orçamentos': '/app/orcamentos',
    'Trabalhos': '/app/trabalhos',
    'Materiais': '/app/materiais',
    'A receber': '/app/a-receber',
  }
  const href = hrefMap[label] || '/app'
  return <a href={href} className={`flex flex-col items-center gap-1 rounded-lg py-1 text-[11px] ${active ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>{icon}<span>{label}</span></a> 
}

function FileIcon() { return <span className="flex size-5 items-center justify-center text-base leading-none">▤</span> }