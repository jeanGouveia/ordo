import { createFileRoute } from '@tanstack/react-router'
import { Hammer, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export const Route = createFileRoute('/app/trabalhos')({
  head: () => ({ meta: [{ title: 'Trabalhos · Ordem Simples' }] }),
  component: JobsPage,
})

function JobsPage() {
  return <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-10"><div className="flex items-center justify-between gap-3"><div><p className="text-sm text-primary">Agenda</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Trabalhos</h1><p className="mt-1 text-sm text-muted-foreground">Acompanhe o que precisa ser feito e entregue.</p></div><Button><Plus /> Novo trabalho</Button></div><Card><CardContent className="flex flex-col items-center justify-center gap-3 p-10 text-center"><div className="rounded-full bg-primary/10 p-4 text-primary"><Hammer /></div><h2 className="text-lg font-semibold">Seus trabalhos aparecem aqui</h2><p className="max-w-sm text-sm text-muted-foreground">Aprove um orçamento ou crie um trabalho direto para começar.</p></CardContent></Card></div>
}
