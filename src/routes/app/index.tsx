import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  Check,
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

export const Route = createFileRoute('/app/')({
  head: () => ({
    meta: [
      { title: 'Hoje · Ordem Simples' },
      { name: 'description', content: 'Do orçamento à entrega, sem perder prazo, material ou dinheiro.' },
    ],
  }),
  component: TodayPage,
})

type Job = { id: string; title: string; customer: string; date: string; detail: string; tone: 'warn' | 'ok' }

const initialJobs: Job[] = [
  { id: 'cozinha', title: 'Cozinha planejada', customer: 'João Silva', date: '28/09', detail: 'Faltam 2 chapas de MDF Carvalho', tone: 'warn' },
  { id: 'camisetas', title: '50 camisetas personalizadas', customer: 'Igreja Esperança', date: '30/09', detail: 'Faltam 20 camisetas pretas G', tone: 'warn' },
  { id: 'armario', title: 'Armário do quarto', customer: 'Maria Oliveira', date: '03/10', detail: 'Materiais separados', tone: 'ok' },
]

function TodayPage() {
  const [jobs, setJobs] = useState(initialJobs)
  const [bought, setBought] = useState(false)
  const [received, setReceived] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [newTitle, setNewTitle] = useState('')

  const pending = useMemo(() => (received ? 0 : 4250), [received])

  function addJob() {
    if (!newTitle.trim()) return
    setJobs(current => [{ id: crypto.randomUUID(), title: newTitle, customer: 'Novo cliente', date: '05/10', detail: 'Defina os materiais necessários', tone: 'warn' }, ...current])
    setNewTitle('')
    setShowNew(false)
    toast.success('Trabalho criado', { description: 'Agora você pode completar os materiais e a data.' })
  }

  function markBought() {
    setBought(true)
    toast.success('Compra registrada', { description: '2 chapas de MDF Carvalho adicionadas ao estoque.' })
  }

  function markReceived() {
    setReceived(true)
    toast.success('Recebimento marcado', { description: 'O saldo de João Silva foi recebido.' })
  }

  return (
    <div className="min-h-dvh bg-background pb-24 md:pb-8">
      <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 lg:px-10 lg:py-8">
        <header className="mb-7 flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              <span className="h-2 w-2 rounded-full bg-primary" /> Ordem Simples
            </p>
            <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Bom dia, Oliveira.</h1>
            <p className="mt-1 text-sm text-muted-foreground">Aqui está o que merece sua atenção hoje.</p>
          </div>
          <Button onClick={() => setShowNew(true)} className="hidden shrink-0 sm:inline-flex">
            <Plus /> Novo trabalho
          </Button>
        </header>

        <section aria-labelledby="answers-title" className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="answers-title" className="text-sm font-semibold text-foreground">O que precisa de atenção?</h2>
            <span className="font-mono text-[11px] text-muted-foreground">14 SET 2026</span>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <AnswerCard icon={<Hammer />} label="Preciso fazer" value="2 trabalhos" detail="1 para os próximos 7 dias" tone="primary" />
            <AnswerCard icon={<ShoppingCart />} label="Preciso comprar" value={bought ? 'Tudo em dia' : '2 itens'} detail={bought ? 'Estoque atualizado agora' : 'MDF Carvalho · até 25/09'} tone="amber" onClick={bought ? undefined : markBought} />
            <AnswerCard icon={<WalletCards />} label="Preciso receber" value={pending ? 'R$ 4.250,00' : 'Tudo recebido'} detail={pending ? 'João Silva · vence em 14 dias' : 'Nenhum saldo pendente'} tone="green" onClick={pending ? markReceived : undefined} />
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
          <section aria-labelledby="jobs-title">
            <div className="mb-3 flex items-center justify-between"><div><h2 id="jobs-title" className="text-lg font-semibold">Trabalhos</h2><p className="text-sm text-muted-foreground">O que está na sua agenda.</p></div><a href="/app#jobs" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">Ver todos <ArrowRight className="size-4" /></a></div>
            <div className="space-y-3">
              {jobs.map(job => <JobCard key={job.id} job={job} />)}
            </div>
          </section>

          <div className="space-y-5">
            <section aria-labelledby="buy-title">
              <div className="mb-3 flex items-center justify-between"><div><h2 id="buy-title" className="text-lg font-semibold">Preciso comprar</h2><p className="text-sm text-muted-foreground">O estoque futuro não fecha.</p></div><PackageSearch className="size-5 text-primary" /></div>
              <Card className="border-amber-500/30 bg-amber-50/70 shadow-none dark:bg-amber-950/20">
                <CardContent className="p-4">
                  {bought ? <div className="flex items-start gap-3"><div className="rounded-full bg-emerald-600/15 p-2 text-emerald-700"><Check className="size-4" /></div><div><p className="font-semibold">Compra adicionada ao estoque</p><p className="mt-1 text-sm text-muted-foreground">MDF Carvalho agora cobre a Cozinha planejada.</p></div></div> : <><div className="flex items-start gap-3"><div className="rounded-full bg-amber-500/15 p-2 text-amber-700"><AlertTriangle className="size-4" /></div><div><p className="font-semibold">2 chapas MDF Carvalho</p><p className="mt-1 text-sm text-muted-foreground">Necessário até 25/09 · Cozinha planejada</p></div></div><Button onClick={markBought} variant="outline" className="mt-4 w-full bg-background">Comprei e adicionar ao estoque</Button></>}
                </CardContent>
              </Card>
            </section>

            <section aria-labelledby="receivables-title">
              <div className="mb-3 flex items-center justify-between"><div><h2 id="receivables-title" className="text-lg font-semibold">A receber</h2><p className="text-sm text-muted-foreground">Dinheiro dos trabalhos.</p></div><CircleDollarSign className="size-5 text-primary" /></div>
              <Card className="shadow-none"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-wider text-muted-foreground">Saldo pendente</p><p className="mt-1 text-2xl font-semibold tabular-nums">{pending ? 'R$ 4.250,00' : 'R$ 0,00'}</p></div><div className="rounded-full bg-primary/10 p-3 text-primary"><WalletCards className="size-5" /></div></div>{pending ? <Button onClick={markReceived} variant="outline" className="mt-4 w-full">Marcar saldo como recebido</Button> : <p className="mt-3 text-sm text-emerald-700">Tudo certo por aqui.</p>}</CardContent></Card>
            </section>
          </div>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 px-2 py-2 backdrop-blur md:hidden"><div className="mx-auto grid max-w-md grid-cols-4 gap-1"><MobileNav icon={<CalendarDays />} label="Hoje" active /><MobileNav icon={<FileIcon />} label="Orçamentos" /><MobileNav icon={<Hammer />} label="Trabalhos" /><MobileNav icon={<ShoppingCart />} label="Materiais" /></div></nav>

      {showNew && <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/35 p-3 sm:items-center"><div role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-lg"><div className="mb-5 flex items-center justify-between"><div><h2 className="text-lg font-semibold">Novo trabalho</h2><p className="text-sm text-muted-foreground">Comece pelo que você precisa entregar.</p></div><Button variant="ghost" size="icon" aria-label="Fechar" onClick={() => setShowNew(false)}><X /></Button></div><label className="text-sm font-medium" htmlFor="job-title">Nome do trabalho</label><input id="job-title" value={newTitle} onChange={event => setNewTitle(event.target.value)} placeholder="Ex.: Fachada da loja" className="mt-2 h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" autoFocus /><Button className="mt-4 w-full" onClick={addJob}>Criar trabalho</Button></div></div>}
    </div>
  )
}

function AnswerCard({ icon, label, value, detail, tone, onClick }: { icon: ReactNode; label: string; value: string; detail: string; tone: 'primary' | 'amber' | 'green'; onClick?: () => void }) {
  const colors = { primary: 'bg-primary text-primary-foreground', amber: 'bg-amber-500 text-amber-950', green: 'bg-emerald-600 text-emerald-50' }
  return <button type="button" onClick={onClick} className="group rounded-xl text-left transition-transform hover:-translate-y-0.5 active:scale-[0.98]" disabled={!onClick}><Card className="h-full border-border/80 shadow-sm transition-shadow group-hover:shadow-md"><CardContent className="p-4"><div className="flex items-start justify-between gap-3"><div className={`rounded-lg p-2 ${colors[tone]}`}>{icon}</div>{onClick && <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />}</div><p className="mt-4 text-sm text-muted-foreground">{label}</p><p className="mt-1 text-xl font-semibold tracking-tight">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></CardContent></Card></button>
}

function JobCard({ job }: { job: Job }) { return <Card className="shadow-none transition-shadow hover:shadow-sm"><CardContent className="flex items-center gap-3 p-4"><div className={`h-10 w-1 rounded-full ${job.tone === 'warn' ? 'bg-amber-500' : 'bg-emerald-600'}`} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-x-2 gap-y-1"><h3 className="font-semibold">{job.title}</h3><span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{job.date}</span></div><p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><UserRound className="size-3.5" /> {job.customer}</p><p className={`mt-2 text-xs ${job.tone === 'warn' ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}`}>{job.tone === 'warn' ? '⚠ ' : '✓ '}{job.detail}</p></div><ChevronRight className="size-5 shrink-0 text-muted-foreground" /></CardContent></Card> }
function MobileNav({ icon, label, active }: { icon: ReactNode; label: string; active?: boolean }) { return <a href="/app" className={`flex flex-col items-center gap-1 rounded-lg py-1 text-[11px] ${active ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>{icon}<span>{label}</span></a> }
function FileIcon() { return <span className="flex size-5 items-center justify-center text-base leading-none">▤</span> }
