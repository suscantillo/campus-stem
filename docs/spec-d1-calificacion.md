# D1 — Bloque de Calificación: rúbrica, asignaciones, scoring y resultados

Rebanada vertical completa del sistema de calificación de la hackatón. El admin configura la rúbrica y las asignaciones juez→equipo, abre la fase de calificación, los jueces califican, y al cerrar el admin ve y descarga la tabla de posiciones.

**Principio:** una calificación enviada es definitiva — no se puede editar ni eliminar. El gate `calificacion_abierta` controla el acceso de los jueces. La nota final de un equipo es el promedio de las notas totales de cada juez asignado que haya enviado.

---

## 1. Historias de usuario

### D-1 — Admin: configurar rúbrica

**Como administrador** quiero definir los criterios de la rúbrica (nombre, puntaje máximo) **para** que los jueces tengan una guía clara al calificar.

1. CRUD de criterios: nombre (string), descripción opcional, `puntaje_maximo` (entero ≥ 1).
2. Solo editable mientras `calificacion_abierta = false`. Al abrir la calificación los criterios se congelan.
3. El orden de los criterios es configurable (campo `orden`).
4. Sin criterios no se puede abrir la calificación (validación en el toggle).
5. La rúbrica está en stand-by hasta que el admin la defina — el sistema debe poder operar sin criterios mientras no se haya abierto la calificación.

### D-2 — Admin: gestionar asignaciones juez → equipo

**Como administrador** quiero controlar qué juez evalúa a qué equipo **para** distribuir el trabajo del jurado.

1. Por defecto (al abrir calificación): todos los jueces evalúan a todos los equipos.
2. El admin puede eliminar asignaciones individuales antes de abrir la calificación.
3. El admin puede restaurar la asignación por defecto (todos × todos) con un botón.
4. Vista de matriz: filas = jueces, columnas = equipos, celda = asignado / no asignado.
5. Si un juez ya envió una calificación para un equipo, esa asignación no se puede eliminar.

### D-3 — Admin: toggle calificacion_abierta

**Como administrador** quiero abrir y cerrar la fase de calificación **para** controlar cuándo los jueces pueden enviar sus notas.

1. Toggle en el dashboard admin (mismo patrón que `marketplace_abierto`).
2. Al abrir: se crean automáticamente las asignaciones por defecto si no existen.
3. Si no hay criterios definidos: el toggle no hace nada y muestra un error.
4. Al cerrar: los jueces pierden acceso a enviar calificaciones (endpoint responde 403).
5. Las calificaciones ya enviadas persisten independientemente del estado del gate.

### D-4 — Juez: calificar equipos asignados

**Como juez** quiero ver mis equipos asignados y enviar mi calificación por criterio **para** evaluar el desempeño de cada equipo.

1. Solo accesible mientras `calificacion_abierta = true`.
2. El juez ve solo los equipos que le fueron asignados.
3. Por cada equipo: formulario con un campo numérico por criterio (0 ≤ valor ≤ puntaje_maximo).
4. Campo opcional de comentario por equipo (texto libre).
5. Al enviar: la calificación queda en firme — el botón desaparece y se muestra "Enviada ✓".
6. Un juez no puede enviar dos veces para el mismo equipo.
7. Si la calificación está cerrada mientras el juez tiene el formulario abierto: al intentar enviar recibe error 403.

### D-5 — Admin: ver y descargar tabla de posiciones

**Como administrador** quiero ver el ranking final de equipos y descargarlo en Excel **para** anunciar a los ganadores.

1. Disponible siempre (no requiere que la calificación esté cerrada).
2. Tabla: posición, nombre del equipo, nota por cada juez asignado (o "—" si no envió), promedio final, número de calificaciones recibidas.
3. Ordenada de mayor a menor promedio; empates por orden alfabético del equipo.
4. Badge de estado por equipo: "Completo" (todos los jueces asignados enviaron) / "Parcial" / "Sin calificar".
5. Descarga Excel (.xlsx) con: una hoja "Resultados" (ranking) y una hoja "Detalle" (puntaje por criterio, por juez, por equipo).
6. El promedio solo cuenta jueces que hayan enviado; equipos sin calificaciones muestran "—".

---

## 2. Modelo de datos

### Nuevas tablas

```
criterios_rubrica
─────────────────────────────────────────────────────────────────
id              UUID  PK
nombre          TEXT  NOT NULL
descripcion     TEXT  nullable
puntaje_maximo  INT   NOT NULL  CHECK > 0
orden           INT   NOT NULL  DEFAULT 0
created_at      TIMESTAMP

asignaciones_juez
─────────────────────────────────────────────────────────────────
juez_id         UUID  FK → usuarios(id) ON DELETE CASCADE
equipo_id       UUID  FK → equipos(id)  ON DELETE CASCADE
PRIMARY KEY (juez_id, equipo_id)

calificaciones
─────────────────────────────────────────────────────────────────
id              UUID  PK
juez_id         UUID  FK → usuarios(id) SET NULL
equipo_id       UUID  FK → equipos(id)  SET NULL
comentario      TEXT  nullable
created_at      TIMESTAMP
UNIQUE (juez_id, equipo_id)   ← impide doble envío

puntajes_criterio
─────────────────────────────────────────────────────────────────
id                UUID  PK
calificacion_id   UUID  FK → calificaciones(id) CASCADE
criterio_id       UUID  FK → criterios_rubrica(id) SET NULL
puntaje           INT   NOT NULL  CHECK >= 0
```

### Cambio en tabla existente

```
platform_controls
─────────────────────────────────────────────────────────────────
+ calificacion_abierta  BOOL  NOT NULL  DEFAULT false
```

### Relaciones con tablas existentes

- `Usuario` (rol=juez) → `AsignacionJuez` → `Equipo`
- `Calificacion.juez_id` → `Usuario`; `Calificacion.equipo_id` → `Equipo`
- `PuntajeCriterio` es el detalle de cada `Calificacion`

---

## 3. Fórmula de nota final

```
nota_juez(equipo, juez)   = Σ puntaje_i  para todos los criterios i
nota_final(equipo)        = promedio de nota_juez sobre todos los jueces
                            que enviaron calificación para ese equipo
```

No se normaliza a 0–100 en la BD; se muestra el puntaje bruto. La nota máxima posible = Σ puntaje_maximo de todos los criterios.

---

## 4. API endpoints

### Admin — rúbrica

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET    | `/admin/rubrica/criterios` | Listar criterios ordenados |
| POST   | `/admin/rubrica/criterios` | Crear criterio |
| PUT    | `/admin/rubrica/criterios/{id}` | Editar criterio |
| DELETE | `/admin/rubrica/criterios/{id}` | Eliminar criterio (solo si calificación cerrada) |
| PATCH  | `/admin/rubrica/criterios/orden` | Reordenar (array de ids) |

### Admin — asignaciones

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET    | `/admin/calificacion/asignaciones` | Matriz juez × equipo |
| POST   | `/admin/calificacion/asignaciones/reset` | Crear asignaciones todos × todos |
| POST   | `/admin/calificacion/asignaciones` | Añadir asignación individual |
| DELETE | `/admin/calificacion/asignaciones/{juez_id}/{equipo_id}` | Eliminar si no hay calificación enviada |

### Admin — toggle y resultados

| Método | Ruta | Descripción |
|--------|------|-------------|
| PATCH  | `/admin/calificacion/toggle` | Abrir/cerrar calificación |
| GET    | `/admin/calificacion/resultados` | Tabla de posiciones |
| GET    | `/admin/calificacion/resultados/export` | Descarga Excel |

### Juez

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET    | `/calificacion/mis-equipos` | Equipos asignados + estado de calificación |
| GET    | `/calificacion/criterios` | Criterios de la rúbrica activa |
| POST   | `/calificacion/equipos/{equipo_id}` | Enviar calificación (idempotente — error si ya enviada) |

---

## 5. Páginas frontend

### `/admin/calificacion` — AdminCalificacionPage

Cuatro pestañas:

**Pestaña "Rúbrica"**
- Tabla de criterios con inline edit (nombre, puntaje_maximo) y reordenamiento drag-free (flechas arriba/abajo).
- Botón "Añadir criterio".
- Mientras `calificacion_abierta=true`: todo en modo lectura, con aviso "Cierra la calificación para editar la rúbrica".

**Pestaña "Asignaciones"**
- Matriz visual: filas = jueces, columnas = equipos.
- Toggle por celda (asignado ✓ / no asignado).
- Botón "Restablecer (todos × todos)".
- Celdas con calificación enviada muestran un candado — no togglables.

**Pestaña "Calificación"** (gate control)
- Toggle grande igual al de marketplace.
- Muestra: estado actual, cuántos jueces han enviado / total asignado.
- Error inline si se intenta abrir sin criterios.

**Pestaña "Resultados"**
- Tabla con posición, equipo, nota por juez, promedio, badge estado.
- Botón "Descargar Excel".
- Visible en tiempo real (se refresca).

### `/calificar` — JudgePage (nueva, protegida para `juez`)

- Lista de tarjetas de equipos asignados.
- Estado visible por tarjeta: "Pendiente" / "Enviada ✓".
- Al abrir una tarjeta: formulario expandible con un campo numérico por criterio + comentario.
- Botón "Enviar calificación" → confirma y bloquea el formulario.
- Si `calificacion_abierta=false`: banner de aviso, formularios deshabilitados.
- El juez no ve notas de otros jueces.

---

## 6. Reglas de negocio y validaciones

| Regla | Dónde se aplica |
|-------|----------------|
| Calificación enviada es inmutable | Backend: `UNIQUE(juez_id, equipo_id)` + 409 si existe |
| Puntaje de criterio ≤ puntaje_maximo | Backend: validación antes de insertar |
| No se puede abrir sin criterios | Backend: toggle verifica `COUNT(criterios) > 0` |
| No se puede editar criterio con calificación abierta | Backend: verifica `calificacion_abierta` |
| Juez solo ve sus equipos asignados | Backend: filtra por `asignaciones_juez` |
| Endpoint de juez exige `calificacion_abierta` | Backend: dependency `require_calificacion_abierta` |

---

## 7. Migraciones Alembic necesarias

1. `platform_controls`: añadir `calificacion_abierta BOOL DEFAULT false`
2. Crear tabla `criterios_rubrica`
3. Crear tabla `asignaciones_juez`
4. Crear tabla `calificaciones`
5. Crear tabla `puntajes_criterio`

Se puede hacer en una sola migración.

---

## 8. Librerías adicionales necesarias

| Librería | Uso | Instalación |
|----------|-----|-------------|
| `openpyxl` | Generar `.xlsx` en el backend | `pip install openpyxl` |

No se requiere librería adicional en el frontend — la descarga se maneja con un `<a href>` apuntando al endpoint de exportación que devuelve `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`.

---

## 9. Fuera de alcance

- Los jueces no ven la tabla de posiciones (solo el admin).
- Los estudiantes no ven ninguna nota.
- No hay corrección de calificación — enviada = definitiva.
- No hay ponderación de criterios (todos tienen el mismo peso dentro de su puntaje_maximo).
- No hay múltiples rondas de calificación.
- La descarga PDF queda fuera — solo Excel.
