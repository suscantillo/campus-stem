import { apiAuth } from './api'

export interface ProductoResponse {
  id: string
  nombre: string
  descripcion: string | null
  precio: number
  stock: number
  created_at: string
}

export interface ProductoListResponse {
  items: ProductoResponse[]
  total: number
}

export interface ProductoCreate {
  nombre: string
  descripcion?: string | null
  precio: number
  stock: number
}

export interface ProductoUpdate {
  nombre?: string
  descripcion?: string | null
  precio?: number
  stock?: number
}

export interface EquipoPresupuesto {
  id: string
  nombre: string
  presupuesto: number
}

export interface EquipoPresupuestoListResponse {
  items: EquipoPresupuesto[]
  total: number
}

export interface ReversionResponse {
  id: string
  compra_id: string
  admin_id: string | null
  admin_nombre: string | null
  cantidad: number
  created_at: string
}

export interface CompraResponse {
  id: string
  equipo_id: string | null
  equipo_nombre: string | null
  producto_id: string | null
  producto_nombre: string | null
  cantidad: number
  precio_unitario: number
  total: number
  cantidad_revertida: number
  cantidad_disponible: number
  reversiones: ReversionResponse[]
  created_at: string
}

export interface CompraListResponse {
  items: CompraResponse[]
  total: number
}

export interface MarketplaceStatusResponse {
  marketplace_abierto: boolean
  updated_at: string
}

export function toggleMarketplace(marketplace_abierto: boolean) {
  return apiAuth<MarketplaceStatusResponse>('/admin/marketplace/toggle', {
    method: 'PATCH',
    body: JSON.stringify({ marketplace_abierto }),
  })
}

export function listProductosAdmin() {
  return apiAuth<ProductoListResponse>('/admin/marketplace/productos')
}

export function createProducto(data: ProductoCreate) {
  return apiAuth<ProductoResponse>('/admin/marketplace/productos', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateProducto(id: string, data: ProductoUpdate) {
  return apiAuth<ProductoResponse>(`/admin/marketplace/productos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function deleteProducto(id: string) {
  return apiAuth<void>(`/admin/marketplace/productos/${id}`, { method: 'DELETE' })
}

export function listPresupuestos() {
  return apiAuth<EquipoPresupuestoListResponse>('/admin/marketplace/equipos/presupuestos')
}

export function setPresupuesto(equipoId: string, presupuesto: number) {
  return apiAuth<EquipoPresupuesto>(`/admin/marketplace/equipos/${equipoId}/presupuesto`, {
    method: 'PATCH',
    body: JSON.stringify({ presupuesto }),
  })
}

export function listComprasAdmin() {
  return apiAuth<CompraListResponse>('/admin/marketplace/compras')
}

export function revertirCompra(compraId: string, cantidad: number) {
  return apiAuth<CompraResponse>(`/admin/marketplace/compras/${compraId}/revertir`, {
    method: 'POST',
    body: JSON.stringify({ cantidad }),
  })
}
