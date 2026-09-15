import { createFileRoute } from '@tanstack/react-router'
import React from 'react'
import { Building2, Hammer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BlinkClientBoundary } from '@/components/BlinkClientBoundary'
import { blink } from '@/blink/client'

/**
 * Home route (/). Landing page with authentication.
 */
export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <BlinkClientBoundary>
      <div className="min-h-dvh flex flex-col">
        <header className="border-b border-border bg-background">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold">
                OR
              </div>
              <span className="font-semibold">ORDO</span>
            </div>
            <Button
              onClick={() => window.location.href = '/app'}
              variant="ghost"
            >
              Entrar
            </Button>
          </div>
        </header>

        <main className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-12 text-center sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Do orçamento à entrega, sem perder prazo, material ou dinheiro.
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Sistema simples para pequenos negócios que produzem ou prestam serviços sob encomenda.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            <FeatureCard
              icon={<Hammer className="h-6 w-6" />}
              title="O que preciso fazer?"
              description="Acompanhe trabalhos, prazos e status em um só lugar."
            />
            <FeatureCard
              icon={<Building2 className="h-6 w-6" />}
              title="O que preciso comprar?"
              description="Saiba exatamente quais materiais comprar e quando."
            />
            <FeatureCard
              icon={<span className="text-2xl">💰</span>}
              title="O que preciso receber?"
              description="Controle entradas, saldos e cobranças de clientes."
            />
          </div>

          <div className="flex gap-4">
            <Button
              size="lg"
              onClick={() => {
                blink.auth.signInWithGoogle().catch(console.error)
              }}
            >
              Entrar com Google
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                blink.auth.login()
              }}
            >
              Entrar com Email
            </Button>
          </div>
        </main>

        <footer className="border-t border-border bg-background py-6">
          <div className="mx-auto max-w-6xl px-4 text-center text-sm text-muted-foreground sm:px-6 lg:px-8">
            <p>© 2024 ORDO · Valtun</p>
          </div>
        </footer>
      </div>
    </BlinkClientBoundary>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <Card>
      <CardContent className="p-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          {icon}
        </div>
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}
