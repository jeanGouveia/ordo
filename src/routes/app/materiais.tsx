import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Plus, PackageSearch, Edit, Trash2, TrendingUp, TrendingDown, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth'
import { getMaterials, getMaterialVariants, getStockMovements } from '@/lib/queries'
import { createMaterial, updateMaterial, deleteMaterial, createMaterialVariant, deleteMaterialVariant, createStockMovement } from '@/lib/mutations'
import { materialSchema, materialVariantSchema, stockMovementSchema } from '@/lib/schemas'
import { toast } from 'sonner'
import type { MaterialInput, MaterialVariantInput, StockMovementInput } from '@/lib/schemas'

export const Route = createFileRoute('/app/materiais')({
  head: () => ({ meta: [{ title: 'Materiais · Ordem Simples' }] }),
  component: MaterialsPage,
})

function MaterialsPage() {
  const { company } = useAuth()
  const [materials, setMaterials] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showStockModal, setShowStockModal] = useState(false)
  const [showVariantsModal, setShowVariantsModal] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<any | null>(null)
  const [selectedMaterial, setSelectedMaterial] = useState<any | null>(null)
  const [variants, setVariants] = useState<MaterialVariantInput[]>([])
  const [stockMovements, setStockMovements] = useState<any[]>([])
  const [formData, setFormData] = useState<MaterialInput>({
    name: '',
    unit: 'unidade',
    currentQuantity: 0,
    minimumQuantity: undefined,
    notes: '',
  })
  const [stockFormData, setStockFormData] = useState<StockMovementInput>({
    materialId: '',
    variantId: undefined,
    jobId: undefined,
    quantity: 0,
    movementType: 'entry',
    note: '',
  })

  const loadMaterials = async () => {
    if (!company) return
    setLoading(true)
    try {
      const data = await getMaterials(company.id)
      setMaterials(data)
    } catch (error) {
      console.error('Error loading materials:', error)
      toast.error('Erro ao carregar materiais')
    } finally {
      setLoading(false)
    }
  }

  const loadVariants = async (materialId: string) => {
    if (!company) return
    try {
      const data = await getMaterialVariants(materialId, company.id)
      setVariants(data.map((v: any) => ({
        materialId: v.materialId,
        label: v.label,
      })))
    } catch (error) {
      console.error('Error loading variants:', error)
    }
  }

  const loadStockMovements = async (materialId?: string) => {
    if (!company) return
    try {
      const data = await getStockMovements(company.id, materialId)
      setStockMovements(data)
    } catch (error) {
      console.error('Error loading stock movements:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!company) return

    try {
      const validatedData = materialSchema.parse(formData)
      
      if (editingMaterial) {
        await updateMaterial(editingMaterial.id, validatedData, company.id)
        toast.success('Material atualizado com sucesso')
      } else {
        await createMaterial(validatedData, company.id)
        toast.success('Material criado com sucesso')
      }
      
      setShowModal(false)
      setEditingMaterial(null)
      setFormData({
        name: '',
        unit: 'unidade',
        currentQuantity: 0,
        minimumQuantity: undefined,
        notes: '',
      })
      loadMaterials()
    } catch (error) {
      console.error('Error saving material:', error)
      toast.error('Erro ao salvar material')
    }
  }

  const handleEdit = (material: any) => {
    setEditingMaterial(material)
    setFormData({
      name: material.name,
      unit: material.unit,
      currentQuantity: Number(material.currentQuantity),
      minimumQuantity: material.minimumQuantity ? Number(material.minimumQuantity) : undefined,
      notes: material.notes || '',
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!company) return
    if (!confirm('Tem certeza que deseja excluir este material?')) return

    try {
      await deleteMaterial(id, company.id)
      toast.success('Material excluído com sucesso')
      loadMaterials()
    } catch (error) {
      console.error('Error deleting material:', error)
      toast.error('Erro ao excluir material')
    }
  }

  const handleStockMovement = (material: any) => {
    setSelectedMaterial(material)
    setStockFormData({
      materialId: material.id,
      variantId: undefined,
      jobId: undefined,
      quantity: 0,
      movementType: 'entry',
      note: '',
    })
    loadStockMovements(material.id)
    setShowStockModal(true)
  }

  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!company) return

    try {
      const validatedData = stockMovementSchema.parse(stockFormData)
      await createStockMovement(validatedData, company.id)
      toast.success('Movimentação registrada com sucesso')
      setShowStockModal(false)
      setSelectedMaterial(null)
      loadMaterials()
    } catch (error) {
      console.error('Error saving stock movement:', error)
      toast.error('Erro ao registrar movimentação')
    }
  }

  const handleVariants = (material: any) => {
    setSelectedMaterial(material)
    loadVariants(material.id)
    setShowVariantsModal(true)
  }

  const addVariant = () => {
    setVariants([...variants, {
      materialId: selectedMaterial?.id || '',
      label: '',
    }])
  }

  const updateVariant = (index: number, field: keyof MaterialVariantInput, value: any) => {
    const newVariants = [...variants]
    newVariants[index] = { ...newVariants[index], [field]: value }
    setVariants(newVariants)
  }

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index))
  }

  const handleSaveVariants = async () => {
    if (!company || !selectedMaterial) return

    try {
      for (const variant of variants) {
        if (variant.label) {
          const validated = materialVariantSchema.parse(variant)
          await createMaterialVariant(validated, company.id)
        }
      }
      toast.success('Variantes salvas com sucesso')
      setShowVariantsModal(false)
      setSelectedMaterial(null)
      setVariants([])
    } catch (error) {
      console.error('Error saving variants:', error)
      toast.error('Erro ao salvar variantes')
    }
  }

  useEffect(() => {
    if (company) {
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

  const lowStockMaterials = materials.filter(m => {
    const current = Number(m.currentQuantity)
    const minimum = m.minimumQuantity ? Number(m.minimumQuantity) : 0
    return current <= minimum
  })

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-10">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-primary">Estoque futuro</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Materiais</h1>
          <p className="mt-1 text-sm text-muted-foreground">Saiba o que você tem e o que precisa comprar.</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus /> Novo material
        </Button>
      </div>

      {lowStockMaterials.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-50/70 dark:bg-amber-950/20">
          <CardContent className="flex items-start gap-3 p-5">
            <ShoppingCart className="mt-0.5 text-amber-700" />
            <div>
              <h2 className="font-semibold">Estoque baixo</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {lowStockMaterials.length} material(ais) com estoque abaixo do mínimo
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {materials.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 p-10 text-center">
            <div className="rounded-full bg-primary/10 p-4 text-primary">
              <PackageSearch />
            </div>
            <h2 className="text-lg font-semibold">Nenhum material cadastrado ainda</h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              Cadastre materiais simples como MDF, camisetas, tinta ou ferragens.
            </p>
            <Button onClick={() => setShowModal(true)} variant="outline">
              <Plus /> Cadastrar material
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {materials.map((material) => {
            const isLowStock = Number(material.currentQuantity) <= (material.minimumQuantity ? Number(material.minimumQuantity) : 0)
            return (
              <Card key={material.id} className={isLowStock ? 'border-amber-500/30' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{material.name}</h3>
                        {isLowStock && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                            Estoque baixo
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Unidade: {material.unit}
                      </p>
                      <p className="mt-2 text-lg font-semibold">
                        {Number(material.currentQuantity)} {material.unit}
                      </p>
                      {material.minimumQuantity && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Mínimo: {material.minimumQuantity} {material.unit}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStockMovement(material)}
                      >
                        <ShoppingCart className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleVariants(material)}
                      >
                        <TrendingUp className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(material)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(material.id)}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/35 p-3">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold">
                {editingMaterial ? 'Editar material' : 'Novo material'}
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
                  <Label htmlFor="unit">Unidade *</Label>
                  <select
                    id="unit"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value as any })}
                    className="mt-2 h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                    required
                  >
                    <option value="unidade">Unidade</option>
                    <option value="chapa">Chapa</option>
                    <option value="metro">Metro</option>
                    <option value="m²">m²</option>
                    <option value="caixa">Caixa</option>
                    <option value="pacote">Pacote</option>
                    <option value="litro">Litro</option>
                    <option value="kg">kg</option>
                    <option value="rolo">Rolo</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="currentQuantity">Quantidade atual</Label>
                    <Input
                      id="currentQuantity"
                      type="number"
                      value={formData.currentQuantity}
                      onChange={(e) => setFormData({ ...formData, currentQuantity: Number(e.target.value) })}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <Label htmlFor="minimumQuantity">Quantidade mínima</Label>
                    <Input
                      id="minimumQuantity"
                      type="number"
                      value={formData.minimumQuantity || ''}
                      onChange={(e) => setFormData({ ...formData, minimumQuantity: e.target.value ? Number(e.target.value) : undefined })}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="notes">Observações</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    {editingMaterial ? 'Atualizar' : 'Criar'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowModal(false)
                      setEditingMaterial(null)
                      setFormData({
                        name: '',
                        unit: 'unidade',
                        currentQuantity: 0,
                        minimumQuantity: undefined,
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

      {showStockModal && selectedMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/35 p-3">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold">Movimentação de estoque</h2>
              <p className="text-sm text-muted-foreground">{selectedMaterial.name}</p>
              
              <form onSubmit={handleStockSubmit} className="mt-4 space-y-4">
                <div>
                  <Label htmlFor="movementType">Tipo de movimentação</Label>
                  <select
                    id="movementType"
                    value={stockFormData.movementType}
                    onChange={(e) => setStockFormData({ ...stockFormData, movementType: e.target.value as any })}
                    className="mt-2 h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="entry">Entrada</option>
                    <option value="exit">Saída</option>
                    <option value="adjustment">Ajuste</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="quantity">Quantidade</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={stockFormData.quantity}
                    onChange={(e) => setStockFormData({ ...stockFormData, quantity: Number(e.target.value) })}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="note">Observação</Label>
                  <Input
                    id="note"
                    value={stockFormData.note}
                    onChange={(e) => setStockFormData({ ...stockFormData, note: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    Registrar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowStockModal(false)
                      setSelectedMaterial(null)
                      setStockFormData({
                        materialId: '',
                        variantId: undefined,
                        jobId: undefined,
                        quantity: 0,
                        movementType: 'entry',
                        note: '',
                      })
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>

              {stockMovements.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold mb-2">Histórico recente</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {stockMovements.slice(0, 5).map((movement) => (
                      <div key={movement.id} className="text-xs text-muted-foreground p-2 bg-muted rounded">
                        <div className="flex items-center gap-2">
                          {movement.movementType === 'entry' && <TrendingUp className="h-3 w-3 text-green-600" />}
                          {movement.movementType === 'exit' && <TrendingDown className="h-3 w-3 text-red-600" />}
                          {movement.movementType === 'adjustment' && <span className="text-blue-600">Ajuste</span>}
                          <span>{movement.quantity} {selectedMaterial.unit}</span>
                        </div>
                        {movement.note && <p className="mt-1">{movement.note}</p>}
                        <p className="mt-1 text-[10px]">{new Date(movement.createdAt).toLocaleDateString('pt-BR')}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {showVariantsModal && selectedMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/35 p-3">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold">Variantes</h2>
              <p className="text-sm text-muted-foreground">{selectedMaterial.name}</p>
              
              <div className="mt-4 space-y-2">
                {variants.map((variant, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Descrição da variante"
                      value={variant.label}
                      onChange={(e) => updateVariant(index, 'label', e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeVariant(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addVariant}
                  className="w-full"
                >
                  <Plus /> Adicionar variante
                </Button>
              </div>

              <div className="mt-4 flex gap-2">
                <Button onClick={handleSaveVariants} className="flex-1">
                  Salvar variantes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowVariantsModal(false)
                    setSelectedMaterial(null)
                    setVariants([])
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
