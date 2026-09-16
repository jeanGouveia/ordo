import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import React, { useState } from 'react'
import { Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { blink } from '@/blink/client'
import { BlinkClientBoundary } from '@/components/BlinkClientBoundary'
import { companySchema } from '@/lib/schemas'
import { waitForAuthReady, getCompanyForUser } from '@/lib/auth-guards'
import { useAuth } from '@/lib/auth'

export const Route = createFileRoute('/setup-company')({
  beforeLoad: async () => {
    // Wait for Blink auth to finish initializing
    const isAuthenticated = await waitForAuthReady()
    
    if (!isAuthenticated) {
      throw redirect({ to: '/' })
    }

    const user = blink.auth.currentUser()
    if (!user) {
      throw redirect({ to: '/' })
    }

    const company = await getCompanyForUser(user.id)
    if (company) {
      throw redirect({ to: '/app' })
    }
  },
  component: SetupCompanyPage,
})

function SetupCompanyPage() {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    responsibleName: '',
    phone: '',
    businessType: '',
  })
  const navigate = useNavigate()
  const { refreshCompany } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const user = blink.auth.currentUser()
      if (!user) {
        toast.error('Usuário não autenticado')
        return
      }

      const validatedData = companySchema.parse(formData)

      await blink.db.table('companies').create({
        ...validatedData,
        id: `cmp_${crypto.randomUUID()}`,
        ownerUserId: user.id,
        createdAt: new Date().toISOString(),
      })

      toast.success('Empresa cadastrada com sucesso!')
      
      // Refresh company state in AuthProvider
      await refreshCompany()
      
      // Navigate to /app using TanStack Router (client-side)
      navigate({ to: '/app' })
    } catch (error) {
      console.error('Error creating company:', error)
      toast.error('Erro ao cadastrar empresa')
    } finally {
      setLoading(false)
    }
  }

  return (
    <BlinkClientBoundary>
      <div className="min-h-dvh flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-2xl font-semibold">Configurar sua empresa</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Configure o ORDO para começar a gerenciar seus trabalhos.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome da empresa *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex.: Marcenaria Oliveira"
                  required
                />
              </div>

              <div>
                <Label htmlFor="responsibleName">Nome do responsável</Label>
                <Input
                  id="responsibleName"
                  value={formData.responsibleName}
                  onChange={(e) => setFormData({ ...formData, responsibleName: e.target.value })}
                  placeholder="Ex.: João Silva"
                />
              </div>

              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Ex.: (11) 99999-9999"
                />
              </div>

              <div>
                <Label htmlFor="businessType">Tipo de negócio</Label>
                <Input
                  id="businessType"
                  value={formData.businessType}
                  onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                  placeholder="Ex.: Marcenaria, Estamparia, Gráfica"
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Cadastrando...' : 'Cadastrar empresa'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </BlinkClientBoundary>
  )
}
