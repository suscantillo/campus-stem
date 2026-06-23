# B1 — Equipos: generación, líderes y gestión manual

Rebanada vertical ampliada: el admin forma equipos para la hackatón, configura líderes y corrige la asignación manualmente. Incluye exportación Excel del listado de estudiantes (extensión de A6).

**Principio:** persistencia en BD (`equipos` + `usuarios.equipo_id` + `equipos.lider_id`); reglas de negocio en backend; Excel generado en frontend desde `GET /admin/students`.

> **Nota sobre el backlog:** la historia original **B2** (*modificar composición y líder*) queda **absorbida por B1**. B1 pasa a cubrir generación automática **y** CRUD manual. **B3** (estudiante ve su equipo) sigue pendiente.

---

## 1. Historias de usuario (B1 unificada)

### B1 — Equipos (generación + gestión)

**Como administrador** quiero generar equipos aleatorios, configurar cómo se asigna el líder y editar equipos manualmente **para** organizar la hackatón y corregir casos especiales (registros tardíos, ausencias).

#### Generación automática

1. Botón **Generar equipos** en `/admin/equipos`.
2. **Tamaño del equipo** configurable (2–20, default 4).
3. **Asignación de líder** configurable al generar:
   - `none` — sin líder
   - `random` — un miembro aleatorio por equipo (default)
   - `first` — primer miembro de cada equipo (tras el shuffle)
4. Regenerar pide confirmación y **reemplaza** toda la asignación anterior.
5. Mezcla aleatoria global (colegios y grados mezclados).
6. El último equipo puede tener menos miembros que el tamaño configurado.
7. Sin estudiantes → `400` con mensaje claro.

#### Gestión manual (ex-B2)

8. **Crear equipo vacío** para asignar estudiantes después.
9. **Renombrar** un equipo.
10. **Eliminar** un equipo (miembros quedan sin equipo).
11. **Quitar** un estudiante de su equipo (sin borrar al estudiante).
12. **Mover** un estudiante a otro equipo.
13. **Designar / quitar líder** manualmente (líder debe ser miembro del equipo).
14. Panel **Sin equipo** lista estudiantes no asignados y permite asignarlos.

#### Visibilidad admin

15. Tarjetas con miembros, badge **Líder**, etiqueta de colegio (`MIXTO` / nombre único).
16. Listado de estudiantes (A6) incluye columnas **Equipo** y **Líder**.
17. Excel incluye columnas Equipo y Líder.
18. KPI **Equipos** en inicio admin refleja total real.

#### Fuera de alcance (B3+)

- El **estudiante** aún **no** ve su equipo (historia B3).
- Sin presupuesto ni marketplace (B4–B9).

**Roles:** `admin` | `super_admin` (`require_roles(ADMIN)`).

---

## 2. Modelo de datos

### Diagrama ER

```
┌─────────────────────────┐         ┌─────────────────────────┐
│        equipos          │         │        usuarios         │
├─────────────────────────┤         ├─────────────────────────┤
│ id (PK, UUID)           │◄────────│ equipo_id (FK, NULL)    │
│ nombre                  │   0..*  │ id (PK)                 │
│ lider_id (FK → usuarios)│────────►│ rol, nombre_completo…   │
│ created_at              │   0..1  └─────────────────────────┘
└─────────────────────────┘
         ▲
         │ lider_id apunta a un usuario que debe ser miembro (validado en app)
```

### Tabla `equipos`

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | UUID PK | |
| `nombre` | VARCHAR NOT NULL | Ej. `Equipo 1` |
| `lider_id` | UUID FK → `usuarios.id` NULL | `ON DELETE SET NULL` |
| `created_at` | TIMESTAMPTZ | Default `now()` |

### Columna en `usuarios`

| Columna | Tipo | Notas |
|---------|------|-------|
| `equipo_id` | UUID FK → `equipos.id` NULL | `ON DELETE SET NULL` |

### Reglas de negocio

| Regla | Comportamiento |
|-------|----------------|
| Un estudiante → un equipo como máximo | `usuarios.equipo_id` único por fila |
| Líder ⊆ miembros | Validación en `PATCH /admin/teams/{id}` |
| Quitar miembro que era líder | `lider_id` se limpia automáticamente |
| Eliminar equipo | Miembros: `equipo_id = NULL`; fila equipo borrada |
| Mover líder a otro equipo | Líderazgo se pierde en el equipo origen |
| Roles privilegiados | No tienen `equipo_id` |

### Migraciones

| Revisión | Contenido |
|----------|-----------|
| `b7c4e1f92a03` | Tabla `equipos`, `usuarios.equipo_id` |
| `c8d5f2a1b904` | `equipos.lider_id` |

```bash
cd backend && alembic upgrade head
```

---

## 3. Backend — API

Base: `/api/v1`. Auth: `Authorization: Bearer <token>`. Rol mínimo: **ADMIN**.

### `GET /admin/teams`

Lista equipos con miembros y líder.

**200** — item de ejemplo:

```json
{
  "id": "uuid",
  "nombre": "Equipo 1",
  "colegio_label": "MIXTO",
  "member_count": 4,
  "lider_id": "uuid",
  "lider_nombre": "Ana López",
  "miembros": [
    {
      "id": "uuid",
      "nombre_completo": "Ana López",
      "colegio": "Colegio A",
      "is_lider": true
    }
  ],
  "created_at": "2026-06-23T..."
}
```

### `POST /admin/teams`

Crea equipo vacío.

**Body:** `{ "nombre": "Equipo extra" }` — `nombre` opcional (auto-numerado).

**201** — `TeamListItem`.

### `POST /admin/teams/generate`

Regenera todos los equipos.

**Body:**

```json
{
  "team_size": 4,
  "leader_assignment": "random"
}
```

| Campo | Tipo | Valores |
|-------|------|---------|
| `team_size` | int | 2–20, default 4 |
| `leader_assignment` | enum | `none` \| `random` \| `first` |

**200:**

```json
{
  "items": [ "..." ],
  "total": 15,
  "students_assigned": 58
}
```

### `PATCH /admin/teams/{team_id}`

Actualiza nombre y/o líder.

**Body** (campos opcionales, solo enviados se aplican):

```json
{
  "nombre": "Equipo Alpha",
  "lider_id": "uuid-del-miembro"
}
```

`lider_id: null` quita el líder.

**400** — `Leader must be a member of the team`

### `DELETE /admin/teams/{team_id}`

Elimina equipo. **204**.

### `PATCH /admin/students/{student_id}/equipo`

Asigna, mueve o desasigna estudiante.

**Body:**

```json
{ "equipo_id": "uuid-del-equipo" }
```

`equipo_id: null` — quitar del equipo.

**204**

### Cambio en `GET /admin/students`

Campos adicionales por item:

| Campo | Tipo |
|-------|------|
| `equipo_id` | UUID \| null |
| `equipo_nombre` | string \| null |
| `es_lider` | bool |

---

## 4. Algoritmo de generación

1. Cargar todos los `estudiante`.
2. Si vacío → `400 No students to assign to teams`.
3. `DELETE` de todos los `equipos` (FK limpia `equipo_id` en miembros).
4. Barajar con `secrets.SystemRandom`.
5. Partir en bloques de `team_size`.
6. Por bloque: crear `Equipo`, asignar miembros.
7. Según `leader_assignment`:
   - `none` — `lider_id` queda NULL
   - `first` — `lider_id = chunk[0].id`
   - `random` — `lider_id = choice(chunk).id`
8. Commit y respuesta.

---

## 5. Archivos

### Backend

| Archivo | Rol |
|---------|-----|
| `app/db/models/teams.py` | `Equipo` + `lider_id` |
| `app/db/models/users.py` | FK `equipo_id`, relationships |
| `app/schemas/teams.py` | DTOs + `LeaderAssignment` |
| `app/schemas/students.py` | `es_lider` |
| `app/services/teams_service.py` | Generación + CRUD |
| `app/services/students_service.py` | `es_lider` en listado |
| `app/api/v1/routes/admin/teams.py` | Rutas equipos |
| `app/api/v1/routes/admin/students.py` | `PATCH .../equipo` |

### Frontend

| Archivo | Rol |
|---------|-----|
| `src/lib/adminTeamsApi.ts` | Cliente API equipos |
| `src/pages/admin/AdminTeamsPage.tsx` | Generación + tarjetas editables |
| `src/pages/admin/AdminStudentsPage.tsx` | Columna Líder + Excel |
| `src/lib/adminStudentsApi.ts` | Tipo `es_lider` |

---

## 6. RBAC

| Endpoint | Rol |
|----------|-----|
| `GET /admin/teams` | ADMIN |
| `POST /admin/teams` | ADMIN |
| `POST /admin/teams/generate` | ADMIN |
| `PATCH /admin/teams/{id}` | ADMIN |
| `DELETE /admin/teams/{id}` | ADMIN |
| `PATCH /admin/students/{id}/equipo` | ADMIN |

---

## 7. Prueba manual

### Generar con líder aleatorio

1. Login admin → `/admin/equipos`.
2. Tamaño `4`, líder **Líder aleatorio por equipo**.
3. **Generar equipos** → cada tarjeta muestra líder y badge.

### CRUD manual

1. **Crear equipo vacío** → asignar desde panel **Sin equipo**.
2. **Renombrar** — clic en nombre del equipo.
3. **Hacer líder** / **Quitar liderazgo** en un miembro.
4. **Mover a** otro equipo o **Quitar**.
5. **Eliminar equipo** → miembros aparecen en **Sin equipo**.

### Estudiantes + Excel

1. `/admin/estudiantes` → columnas Equipo y Líder.
2. **Exportar Excel** → columnas Equipo y Líder.

### cURL

```bash
TOKEN="<access_token_admin>"

curl -s -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"team_size": 4, "leader_assignment": "random"}' \
  http://localhost:8000/api/v1/admin/teams/generate | jq .

curl -s -X PATCH -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"lider_id": "<student_uuid>"}' \
  http://localhost:8000/api/v1/admin/teams/<team_uuid> | jq .

curl -s -X PATCH -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"equipo_id": null}' \
  http://localhost:8000/api/v1/admin/students/<student_uuid>/equipo
```

---

## 8. Errores API → UI

| `detail` (EN) | Español |
|---------------|---------|
| `No students to assign to teams` | No hay estudiantes registrados… |
| `Team not found` | Equipo no encontrado. |
| `Student not found` | Estudiante no encontrado. |
| `Leader must be a member of the team` | El líder debe ser miembro del equipo. |

---

## 9. Impacto en el backlog

| Historia original | Estado |
|-------------------|--------|
| **B1** Generar equipos | ✅ Implementada (ampliada) |
| **B2** Editar equipos / líder | ✅ Absorbida por B1 |
| **B3** Estudiante ve equipo | ⏳ Pendiente |
| **B4–B14** | Sin empezar |

### User story sugerida para el documento de visión

Reemplazar B1 y B2 por:

> **B1.** Como administrador quiero generar equipos aleatorios con tamaño y asignación de líder configurables, y editar manualmente equipos (miembros, líder, nombre) para organizar la hackatón y corregir casos especiales.

---

## 10. Checklist

- [x] Migración `lider_id`
- [x] Generación con `leader_assignment`
- [x] CRUD equipos (crear, renombrar, eliminar)
- [x] Mover / quitar estudiantes
- [x] Designar / quitar líder
- [x] Panel sin equipo
- [x] `es_lider` en listado + Excel
- [x] UI `/admin/equipos`
- [ ] B3 — vista estudiante
- [ ] Formalizar texto en documento de visión
