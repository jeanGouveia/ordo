import { createFileRoute } from '@tanstack/react-router'
import { PackageSearch, Plus, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export const Route = createFileRoute('/app/materiais')({
  head: () => ({ meta: [{ title: 'Materiais · Ordem Simples' }] }),
  component: MaterialsPage,
})

function MaterialsPage() {
  return <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-10"><div className="flex items-center justify-between gap-3"><div><p className="text-sm text-primary">Estoque futuro</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Materiais</h1><p className="mt-1 text-sm text-muted-foreground">Saiba o que você tem e o que precisa comprar.</p></div><Button><Plus /> Novo material</Button></div><Card className="border-amber-500/30 bg-amber-50/70 dark:bg-amber-950/20"><CardContent className="flex items-start gap-3 p-5"><ShoppingCart className="mt-0.5 text-amber-700" /><div><h2 className="font-semibold">Preciso comprar</h2><p className="mt-1 text-sm text-muted-foreground">Quando seus trabalhos estiverem cadastrados, as faltas aparecem automaticamente aqui.</p></div></CardContent></Card><Card><CardContent className="flex flex-col items-center justify-center gap-3 p-10 text-center"><div className="rounded-full bg-primary/10 p-4 text-primary"><PackageSearch /></div><h2 className="text-lg font-semibold">Nenhum material cadastrado ainda</h2><p className="max-w-sm text-sm text-muted-foreground">Cadastre materiais simples como MDF, camisetas, tinta ou ferragens.</p><Button variant="outline"><Plus /> Cadastrar material</Button></CardContent></Card></div>
}
