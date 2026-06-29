# C1 — Marketplace: productos, presupuesto y compras

Rebanada vertical completa del marketplace para la hackatón. El admin gestiona productos y presupuestos de equipos; el líder del equipo compra con moneda ficticia mientras el marketplace esté abierto.

**Principio:** toda la lógica transaccional (verificar stock, presupuesto, compra atómica) vive en el backend. El frontend solo refleja el estado. El gate `marketplace_abierto` controla el acceso completamente.

---

## 1. Historias de usuario

### M-1 — Admin: gestionar productos

**Como administrador** quiero crear, editar y eliminar productos del marketplace **para** controlar qué está disponible para los equipos durante la hackatón.

1. CRUD completo de productos: nombre, descripción, precio (entero ≥ 0), stock (entero ≥ 0).
2. El stock puede ser 0 (producto agotado, no comprable).
3. Eliminar un producto no revierte compras anteriores.
4. Listar productos muestra stock actual y precio.

### M-2 — Admin: gestionar presupuesto por equipo

**Como administrador** quiero ver y ajustar el presupuesto de cada equipo **para** compensar desequilibrios o corregir errores durante el evento.

1. Cada equipo tiene un `presupuesto` (entero, default 1000).
2. Admin puede poner cualquier valor ≥ 0.
3. Ajustar el presupuesto no afecta historial de compras.

### M-3 — Admin: toggle marketplace_abierto

**Como administrador** quiero abrir y cerrar el marketplace con un toggle **para** controlar exactamente cuándo los equipos pueden comprar.

1. Toggle en el dashboard de admin (igual a registro).
2. Si marketplace está cerrado: endpoint de compra responde `403`.
3. Si marketplace está abierto: líderes pueden comprar.

### M-4 — Líder: ver marketplace y comprar

**Como líder de equipo** quiero ver los productos disponibles y comprar con el presupuesto de mi equipo **para** equipar a mi equipo durante la hackatón.

1. Solo accesible si el usuario tiene rol `lider`.
2. Solo comprables cuando `marketplace_abierto = true`.
3. Mostrar presupuesto actual del equipo.
4. Compra reduce el stock del producto y el presupuesto del equipo atómicamente.
5. No se puede comprar si el stock es 0 o si el presupuesto es insuficiente.
6. Historial de compras del propio equipo visible en la misma página.

### M-5 — Admin: historial de compras

**Como administrador** quiero ver todas las compras realizadas **para** auditar el uso del presupuesto de cada equipo.

1. Tabla con: equipo, producto, cantidad, precio unitario, total, fecha.
2. Filtro por equipo o producto.

---

## 2. Modelo de datos

### Diagrama ER

```
┌──────────────┐    ┌──────────────────┐    ┌──────────────┐
│   equipos    │    │     compras      │    │  productos   │
├──────────────┤    ├──────────────────┤    ├──────────────┤
│ id (PK)      │◄───│ equipo_id (FK)   │───►│ id (PK)      │
│ nombre       │    │ producto_id (FK) │    │ nombre       │
│ presupuesto  │    │ cantidad         │    │ descripcion  │
│ lider_id     │    │ precio_unitario  │    │ precio       │
│ ...          │    │ created_at       │    │ stock        │
└──────────────┘    └──────────────────┘    │ created_at   │
                                            └──────────────┘

platform_controls (singleton id=1)
  + marketplace_abierto: bool
```

### Tabla `productos`

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | UUID PK | |
| `nombre` | VARCHAR NOT NULL | |
| `descripcion` | TEXT nullable | |
| `precio` | INTEGER NOT NULL | ≥ 0 |
| `stock` | INTEGER NOT NULL | ≥ 0 |
| `created_at` | TIMESTAMPTZ | Default `now()` |

### Tabla `compras`

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | UUID PK | |
| `equipo_id` | UUID FK → `equipos.id` ON DELETE SET NULL | |
| `producto_id` | UUID FK → `productos.id` ON DELETE SET NULL | |
| `cantidad` | INTEGER NOT NULL | ≥ 1 |
| `precio_unitario` | INTEGER NOT NULL | snapshot del precio al momento de compra |
| `created_at` | TIMESTAMPTZ | Default `now()` |

### Cambios a tablas existentes

- `equipos.presupuesto` — INTEGER NOT NULL DEFAULT 1000
- `platform_controls.marketplace_abierto` — BOOLEAN NOT NULL DEFAULT false

---

## 3. API Endpoints

### Público / Líder

| Método | Path | Descripción | Auth |
|--------|------|-------------|------|
| `GET` | `/marketplace/status` | Estado del marketplace (abierto/cerrado) | Público |
| `GET` | `/marketplace/productos` | Lista de productos | `lider` |
| `GET` | `/marketplace/mi-equipo` | Presupuesto + historial de compras del equipo | `lider` |
| `POST` | `/marketplace/compras` | Realizar una compra | `lider` |

### Admin

| Método | Path | Descripción | Auth |
|--------|------|-------------|------|
| `PATCH` | `/admin/marketplace/toggle` | Abrir/cerrar marketplace | `admin` |
| `GET` | `/admin/marketplace/productos` | Listar todos los productos | `admin` |
| `POST` | `/admin/marketplace/productos` | Crear producto | `admin` |
| `PUT` | `/admin/marketplace/productos/{id}` | Editar producto | `admin` |
| `DELETE` | `/admin/marketplace/productos/{id}` | Eliminar producto | `admin` |
| `PATCH` | `/admin/marketplace/equipos/{id}/presupuesto` | Ajustar presupuesto | `admin` |
| `GET` | `/admin/marketplace/compras` | Historial global de compras | `admin` |

---

## 4. Lógica de negocio

### Compra (transacción atómica)

```
1. Verificar marketplace_abierto == true → 403 si no
2. Verificar que usuario.rol == lider → 403 si no
3. Cargar producto con lock → 404 si no existe
4. Verificar producto.stock >= cantidad → 400 "Stock insuficiente"
5. Cargar equipo con lock → 404 si no existe
6. Calcular total = precio_unitario * cantidad
7. Verificar equipo.presupuesto >= total → 400 "Presupuesto insuficiente"
8. Descontar: producto.stock -= cantidad, equipo.presupuesto -= total
9. Insertar Compra con precio_unitario snapshot
10. Commit
```

---

## 5. Schemas Pydantic

### Productos

- `ProductoCreate`: nombre (1-200), descripcion (opt), precio (≥0), stock (≥0)
- `ProductoUpdate`: todos opcionales
- `ProductoResponse`: id, nombre, descripcion, precio, stock, created_at
- `ProductoListResponse`: items[], total

### Compras

- `CompraRequest`: producto_id (UUID), cantidad (≥1)
- `CompraResponse`: id, equipo_id, equipo_nombre, producto_id, producto_nombre, cantidad, precio_unitario, total, created_at
- `CompraListResponse`: items[], total
- `MiEquipoResponse`: presupuesto, compras[]

### PlatformControls (extensión)

- `MarketplaceToggleRequest`: marketplace_abierto: bool
- `MarketplaceStatusResponse`: marketplace_abierto: bool, updated_at

---

## 6. Rutas frontend

| Path | Componente | Roles |
|------|-----------|-------|
| `/admin/marketplace` | `AdminMarketplacePage` | admin, super_admin |
| `/marketplace` | `MarketplacePage` | lider |

### AdminMarketplacePage — tabs:
1. **Productos** — tabla + modal crear/editar + eliminar
2. **Presupuestos** — tabla de equipos con presupuesto editable
3. **Historial** — tabla de compras con filtro

### MarketplacePage — secciones:
1. Banner estado (abierto/cerrado)
2. KPI presupuesto del equipo
3. Grid de productos (con botón Comprar)
4. Historial de compras del equipo

---

## 7. Control total del admin — Reversiones (C1-addendum)

### Historia M-6 — Admin: revertir compra (parcial o total)

**Como administrador** quiero deshacer una compra (completa o parcial) **para** corregir errores del evento o casos especiales.

1. Reversión **total**: se revierten todas las unidades que queden sin revertir.
2. Reversión **parcial**: el admin elige cuántas unidades revertir (`1 ≤ cantidad ≤ disponibles`).
3. Al revertir:
   - `producto.stock += cantidad_revertida`
   - `equipo.presupuesto += cantidad_revertida × precio_unitario_original`
4. No se puede revertir más de lo que queda pendiente.
5. Cada reversión queda registrada en `reversiones_compra` (auditoría).
6. La `CompraResponse` incluye `cantidad_revertida` y `cantidad_disponible` para que el admin vea el estado.

### Modelo de datos adicional

#### Tabla `reversiones_compra`

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | UUID PK | |
| `compra_id` | UUID FK → `compras.id` ON DELETE CASCADE | |
| `admin_id` | UUID FK → `usuarios.id` ON DELETE SET NULL | quién hizo la reversión |
| `cantidad` | INTEGER NOT NULL | unidades revertidas (≥ 1) |
| `created_at` | TIMESTAMPTZ | Default `now()` |

### Endpoint nuevo

| Método | Path | Descripción | Auth |
|--------|------|-------------|------|
| `POST` | `/admin/marketplace/compras/{id}/revertir` | Revertir parcial o total | `admin` |
| `GET` | `/admin/marketplace/compras/{id}/reversiones` | Historial de reversiones de una compra | `admin` |

### Schemas nuevos

- `ReversionRequest`: `cantidad` (int ≥ 1)
- `ReversionResponse`: id, compra_id, admin_id, admin_nombre, cantidad, created_at
- `CompraResponse` extendida: + `cantidad_revertida`, `cantidad_disponible`

### Regla de negocio

```
cantidad_disponible = compra.cantidad - sum(r.cantidad for r in compra.reversiones)
si cantidad_revertida > cantidad_disponible → 400 "Cantidad supera lo disponible para revertir"
```

---

## 8. Fuera de alcance

- Imágenes de productos (no hay upload de assets)
- Carrito / compra de múltiples productos en una sola transacción
- Límite de compras por producto por equipo
- Notificaciones en tiempo real (WebSocket)
- Marketplace visible para estudiantes sin rol líder (solo ven su equipo vía B3)
- Auditoría de ajustes manuales de presupuesto (solo reversiones de compra se auditan)
