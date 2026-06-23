# A6 — Listado de estudiantes

Rebanada vertical: el admin ve quién se registró. Cierra el Bloque A junto con A4 y A5.

**Principio:** `GET /admin/students` con `require_roles(ADMIN)`; tabla en `/admin/estudiantes` con `apiAuth`.

---

## 1. Historia

**Como administrador** quiero ver la lista de estudiantes registrados **para** tener control de quién participa.

---

## 2. Backend

### Endpoint

```http
GET /api/v1/admin/students
Authorization: Bearer <access_token_admin>
```

Respuesta `200`:

```json
{
  "items": [
    {
      "id": "uuid",
      "nombre_completo": "Juan Perez",
      "colegio": "Colegio STEM",
      "grado": 10,
      "email": "juan@test.com",
      "telefono": "3001234567",
      "equipo_id": "uuid-or-null",
      "equipo_nombre": "Equipo 1",
      "created_at": "2026-06-23T..."
    }
  ],
  "total": 1
}
```

- Solo usuarios con rol `estudiante`
- Orden: más recientes primero (`created_at DESC`)
- Sin contraseñas ni datos de otros roles

Errores:

| HTTP | Causa |
|------|-------|
| 401 | Sin token o token inválido |
| 403 | Rol distinto de admin/super_admin |

### Archivos

| Archivo | Rol |
|---------|-----|
| `app/schemas/students.py` | `StudentListItem`, `StudentListResponse` |
| `app/services/students_service.py` | Query filtrada por rol |
| `app/api/v1/routes/admin/students.py` | `require_roles(ADMIN)` |

---

## 3. Frontend

Ruta: **`/admin/estudiantes`** (ya existía; ahora conectada a la API).

| Feature | Detalle |
|---------|---------|
| Carga inicial | `GET /admin/students` al montar |
| Búsqueda | Client-side (nombre, colegio, email, teléfono, grado, equipo) |
| Actualizar | Botón recarga la lista |
| Exportar Excel | Descarga `.xlsx` con Equipo y Líder (ver [spec-b1](./spec-b1-equipos-y-export-excel.md)) |
| Columnas | Nombre, colegio, grado, equipo, **líder**, email, teléfono |

Archivos:

- `src/lib/adminStudentsApi.ts`
- `src/pages/admin/AdminStudentsPage.tsx`

---

## 4. Prueba del ciclo completo — dos navegadores

Objetivo: en un navegador simular **estudiante** (registro) y en otro **admin** (ver listado), en tiempo casi real.

### Prerrequisitos

```bash
# Terminal 1 — backend
cd backend
source venv/bin/activate
docker compose up -d
alembic upgrade head
python -m app.scripts.bootstrap_superadmin   # una vez
uvicorn app.main:app --reload --port 8000

# Terminal 2 — frontend
cd frontend
npm run dev
```

### Paso 0 — Preparar admin y registro abierto

1. **Navegador A (Admin)** — ventana normal  
   - `http://localhost:5173/login`  
   - Login super admin (`.env`) o admin creado en A5  
   - Ir a `/admin` → **Control del evento** → habilitar registro (toggle conectado a API)

### Paso 1 — Navegador B (Estudiante)

- **Ventana de incógnito** o **otro navegador** (Firefox vs Chrome)  
- `http://localhost:5173/registro`  
- Completar formulario con datos únicos (email distinto cada prueba)  
- Ver notificación de registro exitoso  

### Paso 2 — Navegador A (Admin)

- Ir a `/admin/estudiantes`  
- Pulsar **ACTUALIZAR** si la página ya estaba abierta  
- El estudiante recién registrado debe aparecer en la tabla  

### Paso 3 — Verificar bloqueos

| Acción | Esperado |
|--------|----------|
| Estudiante (B) abre `/admin` | Redirect a `/` |
| Estudiante llama API list | 403 |
| Admin (A) abre `/admin/estudiantes` | Tabla con datos |
| Registro cerrado + nuevo registro (B) | 403 en API / mensaje en UI |

### Paso 4 — Segundo estudiante (opcional)

- Repetir registro en B con otro email  
- Actualizar en A → `total` incrementa  

---

## 5. Diagrama del ciclo

```text
┌─────────────────────┐          ┌─────────────────────┐
│  Navegador B        │          │  Navegador A        │
│  (estudiante)       │          │  (admin)            │
└─────────┬───────────┘          └─────────┬───────────┘
          │                                │
          │ POST /auth/register            │ GET /admin/students
          ▼                                ▼
     ┌────────────────────────────────────────────┐
     │              FastAPI + PostgreSQL             │
     │  usuarios (rol=estudiante)                  │
     └────────────────────────────────────────────┘
          │                                │
          ▼                                ▼
   Sesión estudiante → /            Tabla en /admin/estudiantes
```

---

## 6. Checklist Bloque A (estado)

| Historia | Backend | Front conectado |
|----------|---------|-----------------|
| A2 Registro | ✅ | ✅ |
| A3 Login | ✅ | ✅ |
| A4 Toggle registro | ✅ | ✅ |
| A5 Crear admin/juez | ✅ | ✅ |
| A6 Listar estudiantes | ✅ | ✅ |

---

## 7. Relacionado

- Equipos y export Excel: [spec-b1-equipos-y-export-excel.md](./spec-b1-equipos-y-export-excel.md)

## 8. Pendiente

- [ ] Paginación si supera ~100 estudiantes

---

*A6 cierra el Bloque A con listado real de estudiantes registrados.*
