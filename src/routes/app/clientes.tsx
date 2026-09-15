import { createFileRoute } from '@tanstack/react-router'
import React, { useState, useEffect } from 'react'
import { Plus, Search, Phone, Mail, MapPin, MessageCircle, Trash2, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth'
import { getCustomers, searchCustomers } from '@/lib/queries'
import { createCustomer, updateCustomer, deleteCustomer } from '@/lib/mutations'
import { customerSchema } from '@/lib/schemas'
import { formatPhone, formatWhatsAppLink } from '@/lib/formatters'
import { toast } from 'sonner'
import type { CustomerInput } from '@/lib/schemas'

export const Route = createFileRoute('/app/clientes')({
  head: () => ({ meta: [{ title: 'Clientes · Ordem Simples' }] }),
  component: CustomersPage,
})

function CustomersPage() {
  const { company } = useAuth()
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null)
  const [formData, setFormData] = useState<CustomerInput>({
    name: '',
    whatsapp: '',
    email: '',
    address: '',
    notes: '',
  })

  const loadCustomers = async () => {
    if (!company) return
    setLoading(true)
    try {
      const data = await getCustomers(company.id)
      setCustomers(data)
    } catch (error) {
      console.error('Error loading customers:', error)
      toast.error('Erro ao carregar clientes')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!company) return
    if (!searchQuery.trim()) {
      loadCustomers()
      return
    }
    try {
      const data = await searchCustomers(company.id, searchQuery)
      setCustomers(data)
    } catch (error) {
      console.error('Error searching customers:', error)
      toast.error('Erro ao buscar clientes')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!company) return

    try {
      const validatedData = customerSchema.parse(formData)
      
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, validatedData, company.id)
        toast.success('Cliente atualizado com sucesso')
      } else {
        await createCustomer(validatedData, company.id)
        toast.success('Cliente criado com sucesso')
      }
      
      setShowModal(false)
      setEditingCustomer(null)
      setFormData({
        name: '',
        whatsapp: '',
        email: '',
        address: '',
        notes: '',
      })
      loadCustomers()
    } catch (error) {
      console.error('Error saving customer:', error)
      toast.error('Erro ao salvar cliente')
    }
  }

  const handleEdit = (customer: any) => {
    setEditingCustomer(customer)
    setFormData({
      name: customer.name,
      whatsapp: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      notes: customer.notes || '',
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!company) return
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return

    try {
      await deleteCustomer(id, company.id)
      toast.success('Cliente excluído com sucesso')
      loadCustomers()
    } catch (error) {
      console.error('Error deleting customer:', error)
      toast.error('Erro ao excluir cliente')
    }
  }

  const handleWhatsApp = (phone: string) => {
    const link = formatWhatsAppLink(phone)
    window.open(link, '_blank')
  }

  useEffect(() => {
    if (company) {
      loadCustomers()
    }
  }, [company])

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-10">
        <div className="text-center">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-10">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-primary">Clientes</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Clientes</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gerencie seus clientes e contatos.</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus /> Novo cliente
        </Button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-9"
          />
        </div>
        <Button onClick={handleSearch} variant="outline">
          Buscar
        </Button>
      </div>

      {customers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 p-10 text-center">
            <div className="rounded-full bg-primary/10 p-4 text-primary">
              <Phone className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-semibold">Nenhum cliente cadastrado</h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              Comece adicionando seu primeiro cliente para começar a criar orçamentos e trabalhos.
            </p>
            <Button onClick={() => setShowModal(true)} variant="outline">
              <Plus /> Adicionar cliente
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {customers.map((customer) => (
            <Card key={customer.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold">{customer.name}</h3>
                    <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                      {customer.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3" />
                          <span>{formatPhone(customer.phone)}</span>
                        </div>
                      )}
                      {customer.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3" />
                          <span>{customer.email}</span>
                        </div>
                      )}
                      {customer.address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3" />
                          <span>{customer.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {customer.phone && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleWhatsApp(customer.phone)}
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(customer)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(customer.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/35 p-3">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold">
                {editingCustomer ? 'Editar cliente' : 'Novo cliente'}
              </h2>
              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <div>
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="whatsapp">WhatsApp *</Label>
                  <Input
                    id="whatsapp"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    placeholder="(11) 99999-9999"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="cliente@email.com"
                  />
                </div>
                <div>
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Rua, número, bairro"
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Observações</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Informações adicionais"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    {editingCustomer ? 'Atualizar' : 'Criar'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowModal(false)
                      setEditingCustomer(null)
                      setFormData({
                        name: '',
                        whatsapp: '',
                        email: '',
                        address: '',
                        notes: '',
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
