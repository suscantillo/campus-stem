# A5 — Crear cuentas de admin y juez

Rebanada vertical: super admin crea usuarios privilegiados desde el panel y vía API protegida.

**Principio:** el backend protege (`require_roles(SUPER_ADMIN)`); el frontend acompaña (`ProtectedRoute` solo `super_admin`).

---

## 1. Historia

**Como super admin** quiero crear cuentas de administradores y jueces **para** que el equipo organizador y el jurado puedan entrar a la plataforma.

---

## 2. Diferencia con registro de estudiantes (A2)

| | A2 — Estudiante | A5 — Privilegiado |
|--|-----------------|-------------------|
| Endpoint | `POST /auth/register` | `POST /admin/users` |
| Auth | Público | JWT + **super_admin** |
| Rol | Forzado `estudiante` | Input: `admin` \| `juez` |
| Campos | nombre, colegio, grado, email, teléfono, password | nombre, email, password, rol |
| Gate A4 | Requiere registro habilitado | No aplica |

El schema `CreatePrivilegedUserRequest` **no acepta** `estudiante` ni `super_admin` por esta vía.

---

## 3. Backend

### Endpoint

```http
POST /api/v1/admin/users
Authorization: Bearer <access_token_super_admin>
Content-Type: application/json
```

Body:

```json
{
  "nombre_completo": "María López",
  "email": "maria@uninorte.edu.co",
  "password": "temporal123",
  "rol": "admin"
}
```

`rol` permitido: `"admin"` | `"juez"`.

Respuesta `201`:

```json
{
  "id": "uuid",
  "email": "maria@uninorte.edu.co",
  "rol": "admin",
  "nombre_completo": "María López"
}
```

Errores:

| HTTP | Causa |
|------|-------|
| 401 | Token inválido o ausente |
| 403 | Usuario no es super_admin |
| 409 | Email ya registrado |
| 422 | Validación (password &lt; 8, rol inválido, etc.) |

### Archivos

| Archivo | Rol |
|---------|-----|
| `app/schemas/privileged_users.py` | Request/response + enum `PrivilegedRole` |
| `app/services/privileged_users_service.py` | Creación en BD |
| `app/api/v1/routes/admin/users.py` | Router con `require_roles(SUPER_ADMIN)` |

### Checklist de seguridad

- [x] `POST /admin/users` → `require_roles(SUPER_ADMIN)`
- [x] Rol acotado en schema (no super_admin, no estudiante)
- [x] Password hasheada con bcrypt
- [x] Email único (constraint BD + 409)

---

## 4. Frontend

### Pantalla

Ruta: **`/admin/usuarios`**

- Visible en sidebar solo si `user.rol === 'super_admin'`
- Protegida con `ProtectedRoute allowedRoles={['super_admin']}`
- Formulario: nombre, email, rol (select), contraseña inicial
- Notificación de éxito al crear (email creado)

### Cliente API autenticado

`apiAuth()` en `src/lib/api.ts` adjunta `Authorization: Bearer` desde `localStorage`.

`src/lib/adminUsersApi.ts` → `createPrivilegedUser()`.

### Archivos

| Archivo | Cambio |
|---------|--------|
| `src/pages/admin/AdminUsersPage.tsx` | Formulario conectado |
| `src/pages/admin/AdminLayout.tsx` | Nav "Usuarios" solo super_admin |
| `src/App.tsx` | Ruta `/admin/usuarios` + ProtectedRoute |
| `src/lib/api.ts` | `apiAuth()` |
| `src/lib/adminUsersApi.ts` | POST create |

---

## 5. Cómo probar

### Prerrequisitos

```bash
cd backend
python -m app.scripts.bootstrap_superadmin
uvicorn app.main:app --reload
```

```bash
cd frontend && npm run dev
```

### Flujo super admin

1. Login en `/login` con credenciales del `.env`
2. Entrar a `/admin` → sidebar muestra **Usuarios**
3. Ir a `/admin/usuarios`
4. Crear admin o juez
5. Cerrar sesión → login con la cuenta nueva → admin va a `/admin`, juez a `/`

### Flujo admin normal (no super)

1. Login como admin creado en paso anterior
2. Sidebar **sin** enlace Usuarios
3. Ir manualmente a `/admin/usuarios` → redirect a `/` (ProtectedRoute)
4. API directa con token admin:

```bash
curl -X POST http://localhost:8000/api/v1/admin/users \
  -H "Authorization: Bearer <token_admin>" \
  -H "Content-Type: application/json" \
  -d '{"nombre_completo":"X","email":"x@test.com","password":"12345678","rol":"juez"}'
# Esperado: 403 Insufficient permissions
```

---

## 6. Pendiente

- [ ] Listar admins/jueces existentes (GET) — fuera de alcance acordado para A5 inicial
- [ ] Editar / desactivar cuentas privilegiadas
- [ ] Forzar cambio de contraseña en primer login
- [ ] Conectar toggle A4 del panel admin a la API

---

*Implementado como rebanada vertical A5 — backend + panel admin conectados.*
