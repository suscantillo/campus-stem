import { api, apiAuth } from './api'

export interface MarketplaceStatus {
  marketplace_abierto: boolean
  updated_at: string
}

export interface Producto {
  id: string
  nombre: string
  descripcion: string | null
  precio: number
  stock: number
  created_at: string
}

export interface ProductoListResponse {
  items: Producto[]
  total: number
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
  created_at: string
}

export interface MiEquipoResponse {
  equipo_id: string
  equipo_nombre: string
  presupuesto: number
  compras: CompraResponse[]
}

export function getMarketplaceStatus() {
  return api<MarketplaceStatus>('/marketplace/status')
}

export function getProductos() {
  return apiAuth<ProductoListResponse>('/marketplace/productos')
}

export function getMiEquipo() {
  return apiAuth<MiEquipoResponse>('/marketplace/mi-equipo')
}

export function comprar(producto_id: string, cantidad: number) {
  return apiAuth<CompraResponse>('/marketplace/compras', {
    method: 'POST',
    body: JSON.stringify({ producto_id, cantidad }),
  })
}
