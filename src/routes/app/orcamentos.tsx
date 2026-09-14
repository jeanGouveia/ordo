import { createFileRoute } from '@tanstack/react-router'
import { FileText, Plus, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export const Route = createFileRoute('/app/orcamentos')({
  head: () => ({ meta: [{ title: 'Orçamentos · Ordem Simples' }] }),
  component: QuotesPage,
})

function QuotesPage() {
  return <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-10"><div className="flex items-center justify-between gap-3"><div><p className="text-sm text-primary">Ordem Simples</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Orçamentos</h1><p className="mt-1 text-sm text-muted-foreground">Propostas claras para seus próximos trabalhos.</p></div><Button><Plus /> Novo orçamento</Button></div><Card><CardContent className="flex flex-col items-center justify-center gap-3 p-10 text-center"><div className="rounded-full bg-primary/10 p-4 text-primary"><FileText /></div><h2 className="text-lg font-semibold">Comece por um orçamento</h2><p className="max-w-sm text-sm text-muted-foreground">Cadastre cliente, itens e valor. Quando ele aprovar, transforme em trabalho.</p><Button variant="outline"><Send /> Criar primeiro orçamento</Button></CardContent></Card></div>
}
