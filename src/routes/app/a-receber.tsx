import { createFileRoute } from '@tanstack/react-router'
import { CircleDollarSign, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export const Route = createFileRoute('/app/a-receber')({
  head: () => ({ meta: [{ title: 'A receber · Ordem Simples' }] }),
  component: ReceivablesPage,
})

function ReceivablesPage() {
  return <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-10"><div><p className="text-sm text-primary">Dinheiro dos trabalhos</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">A receber</h1><p className="mt-1 text-sm text-muted-foreground">Sem financeiro complicado: só o que seus clientes devem.</p></div><div className="grid gap-3 sm:grid-cols-3"><Summary label="Hoje" value="R$ 0,00" /><Summary label="Próximos 7 dias" value="R$ 4.250,00" /><Summary label="Em atraso" value="R$ 0,00" /></div><Card><CardContent className="flex flex-col items-center justify-center gap-3 p-10 text-center"><div className="rounded-full bg-primary/10 p-4 text-primary"><CircleDollarSign /></div><h2 className="text-lg font-semibold">Nenhum recebimento cadastrado</h2><p className="max-w-sm text-sm text-muted-foreground">Ao aprovar um orçamento, defina a entrada e as parcelas do trabalho.</p><Button variant="outline"><MessageCircle /> Como funciona</Button></CardContent></Card></div>
}
function Summary({ label, value }: { label: string; value: string }) { return <Card><CardContent className="p-4"><p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p><p className="mt-2 text-xl font-semibold">{value}</p></CardContent></Card> }
