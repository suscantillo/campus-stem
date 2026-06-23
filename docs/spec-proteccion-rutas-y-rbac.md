# Protección de rutas y RBAC

Documento de referencia para el control de acceso en Campus STEM.

**Principio rector:** el backend protege; el frontend acompaña.

La UI puede ocultar rutas y redirigir, pero la seguridad real vive en que **cada endpoint sensible exija JWT + rol** con `require_roles`. Un usuario malintencionado puede saltarse React Router; no puede saltarse FastAPI si los endpoints están bien protegidos.

---

## 1. Dos capas, dos responsabilidades

| Capa | Ubicación | Objetivo | ¿Seguridad real? |
|------|-----------|----------|------------------|
| **Route guard** | Frontend (`ProtectedRoute`) | Buena UX: no mostrar `/admin` a quien no corresponde | No |
| **RBAC en API** | Backend (`require_roles`) | Autorizar o rechazar cada operación | **Sí** |

```text
Estudiante escribe /admin en el navegador
        │
        ▼
ProtectedRoute ──► redirect a /          (UX)
        │
        (si el front fallara o llamara la API directo)
        ▼
require_roles(ADMIN) ──► 403 Forbidden   (seguridad)
```

---

## 2. Frontend — `ProtectedRoute`

### Implementación

Archivo: `frontend/src/components/ProtectedRoute.tsx`

```tsx
<ProtectedRoute allowedRoles={['admin', 'super_admin']}>
  <AdminLayout />
</ProtectedRoute>
```

Registrado en `App.tsx` envolviendo todo el árbol `/admin/*`.

### Comportamiento

| Situación | Resultado |
|-----------|-----------|
| Sin sesión (`localStorage` vacío) | Redirect → `/login` (guarda `state.from` con la ruta intentada) |
| Sesión con rol no permitido (ej. `estudiante`) | Redirect → `/` con `state.reason: 'forbidden'` |
| `admin` o `super_admin` | Acceso permitido |

### Helpers de rol

En `frontend/src/lib/auth.ts`:

- `hasAnyRole(rol, allowed)` — `super_admin` hace bypass (acceso total en rutas admin).
- `isAdminRole(rol)` — atajo para admin + super_admin.

### Logout en panel admin

`AdminLayout` → botón **SALIR** llama a `AuthContext.logout()` (revoca refresh token + limpia `localStorage`) y redirige a `/login`.

---

## 3. Backend — `require_roles`

Archivo: `backend/app/core/permissions.py`

```python
Depends(require_roles(RolUsuario.ADMIN))
```

- Valida JWT vía `get_current_user`.
- `super_admin` bypass en cualquier `require_roles`.
- Rol no permitido → `403 Insufficient permissions`.

---

## 4. Checklist de seguridad real (endpoints)

Pregunta obligatoria antes de merge o deploy:

> **¿Todos y cada uno de mis endpoints sensibles tienen `require_roles` (o equivalente)?**

### Estado actual del backend

| Endpoint | Auth | `require_roles` | Notas |
|----------|------|-----------------|-------|
| `GET /` | No | — | Health público |
| `GET /api/v1/health` | No | — | OK |
| `GET /api/v1/health/db` | No | — | OK (dev) |
| `GET /api/v1/registration/status` | No | — | Público (A4 lectura) |
| `POST /api/v1/auth/register` | No | — | Público si registro abierto |
| `POST /api/v1/auth/login` | No | — | Público |
| `POST /api/v1/auth/refresh` | No | — | Público (body con refresh token) |
| `POST /api/v1/auth/logout` | No | — | Público (body con refresh token) |
| `PATCH /api/v1/admin/registration` | JWT | **ADMIN** (+ super_admin bypass) | OK |
| `POST /api/v1/admin/users` | JWT | **SUPER_ADMIN** | OK (A5) |
| `GET /api/v1/admin/students` | JWT | **ADMIN** (+ super_admin bypass) | OK (A6) |
| `GET /api/v1/admin/teams` | JWT | **ADMIN** (+ super_admin bypass) | OK (B1) |
| `POST /api/v1/admin/teams` | JWT | **ADMIN** (+ super_admin bypass) | OK (B1) |
| `POST /api/v1/admin/teams/generate` | JWT | **ADMIN** (+ super_admin bypass) | OK (B1) |
| `PATCH /api/v1/admin/teams/{id}` | JWT | **ADMIN** (+ super_admin bypass) | OK (B1) |
| `DELETE /api/v1/admin/teams/{id}` | JWT | **ADMIN** (+ super_admin bypass) | OK (B1) |
| `PATCH /api/v1/admin/students/{id}/equipo` | JWT | **ADMIN** (+ super_admin bypass) | OK (B1) |

### Endpoints futuros (recordatorio)

| Historia | Endpoint esperado | Rol mínimo |
|----------|-------------------|------------|
| ~~A6~~ | ~~`GET /admin/students`~~ | ~~**ADMIN**~~ — hecho |
| ~~B1~~ | ~~equipos CRUD + generate~~ | ~~**ADMIN**~~ — hecho (B2 absorbida) |
| B3 | vista equipo estudiante | **ESTUDIANTE** |
| B* | marketplace, calificación… | **ADMIN** / **JUEZ** + compuertas |

**Regla:** al añadir un endpoint nuevo, marcar en esta tabla si es público o qué rol exige.

---

## 5. Bootstrapping — destraba probar la cadena admin

Sin un super admin en BD no puedes verificar de punta a punta:

- Login como admin → entrar a `/admin`
- Estudiante → bloqueado en front **y** en API
- `PATCH /admin/registration` y futuros endpoints protegidos

### Script de arranque (una vez por entorno)

Variables en `backend/.env`:

```env
SUPERADMIN_EMAIL=tu@correo.edu
SUPERADMIN_PASSWORD=minimo-8-chars
SUPERADMIN_NAME=Super Admin   # opcional
```

Ejecución:

```bash
cd backend
source venv/bin/activate
alembic upgrade head
python -m app.scripts.bootstrap_superadmin
```

Comportamiento idempotente:

- Si el super admin ya existe → mensaje y exit 0.
- Si el email existe con otro rol → error.
- No hay endpoint HTTP para crear super admin (solo terminal + acceso a `.env` y BD).

Archivo: `backend/app/scripts/bootstrap_superadmin.py`

---

## 6. Cómo probar la cadena completa

### A. Super admin / admin entra a `/admin`

```bash
# 1. Bootstrap (si no lo corriste)
python -m app.scripts.bootstrap_superadmin

# 2. Backend + front levantados
uvicorn app.main:app --reload
npm run dev   # en frontend/
```

1. Ir a `http://localhost:5173/login`
2. Credenciales del super admin del `.env`
3. Debe redirigir a `/admin` y mostrar el panel
4. Badge en header: `SUPER ADMIN` o `ADMIN`

### B. Estudiante no entra a `/admin`

1. Registrar un estudiante (registro abierto) o usar uno existente
2. Tras login, ir manualmente a `http://localhost:5173/admin`
3. **Front:** redirect a `/`
4. **API (opcional):** con token de estudiante:

```bash
curl -X PATCH http://localhost:8000/api/v1/admin/registration \
  -H "Authorization: Bearer <access_token_estudiante>" \
  -H "Content-Type: application/json" \
  -d '{"enabled": true}'
# Esperado: 403 Insufficient permissions
```

### C. Sin login

1. Abrir `/admin` en ventana incógnito
2. **Front:** redirect a `/login`

### D. Logout

1. En `/admin`, pulsar **SALIR**
2. Sesión limpia; `/admin` vuelve a mandar a `/login`

---

## 7. Jerarquía de roles (referencia)

```text
super_admin  → bypass en require_roles y ProtectedRoute admin
admin        → panel admin, toggles operativos
juez         → calificación (futuro, ruta /juez pendiente)
estudiante   → registro, login, vista hackatón (futuro)
```

---

## 8. Pendiente

- [ ] Ruta `/juez` con `ProtectedRoute allowedRoles={['juez']}`
- [ ] `GET /auth/me` para validar token al recargar (hoy el front confía en `localStorage`)
- [ ] Conectar panel admin a API (A4 toggle, A6 lista) con `Authorization: Bearer`
- [ ] Mensaje en landing cuando `state.reason === 'forbidden'` (opcional UX)
- [ ] Completar checklist de endpoints a medida que crezca el Bloque B

---

## 9. Archivos relevantes

| Área | Archivo |
|------|---------|
| Route guard | `frontend/src/components/ProtectedRoute.tsx` |
| Rutas | `frontend/src/App.tsx` |
| Sesión | `frontend/src/context/AuthContext.tsx` |
| Roles (front) | `frontend/src/lib/auth.ts` |
| Admin shell | `frontend/src/pages/admin/AdminLayout.tsx` |
| Permisos (back) | `backend/app/core/permissions.py` |
| JWT user | `backend/app/api/deps.py` |
| Bootstrap | `backend/app/scripts/bootstrap_superadmin.py` |

---

*Última actualización: ProtectedRoute en `/admin`, logout real, checklist RBAC y flujo de prueba con bootstrap.*
