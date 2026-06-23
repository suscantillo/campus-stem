# Spec de integración — Login y registro (A2 / A3)

Documento que describe la conexión entre el frontend (Vite + React) y el backend (FastAPI) para registro e inicio de sesión de estudiantes.

Historias cubiertas:

- **A2** — Registro de estudiante
- **A3** — Login con email y contraseña
- Dependencia **A4** — Consulta de registro abierto/cerrado (solo lectura en el front)

---

## 1. Resumen

El frontend dejó de simular auth en memoria y ahora llama a la API real. Tras un login o registro exitoso:

1. Se guardan `access_token`, `refresh_token` y datos del usuario en `localStorage`.
2. Se redirige según el rol del usuario.

El panel admin (`AdminContext`) sigue siendo mock para otras compuertas; **el estado de registro en `/registro` ya viene del backend**.

---

## 2. Configuración

### Backend

```bash
cd backend
source venv/bin/activate
docker compose up -d          # PostgreSQL
alembic upgrade head
python -m app.scripts.bootstrap_superadmin   # una vez
uvicorn app.main:app --reload --port 8000
```

CORS debe incluir el origen de Vite (por defecto `http://localhost:5173`).

### Frontend

Archivo `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000/api/v1
```

```bash
cd frontend
npm install
npm run dev
```

---

## 3. Endpoints utilizados

| Historia | Método | Ruta | Auth | Uso en frontend |
|----------|--------|------|------|-----------------|
| A4 (lectura) | `GET` | `/registration/status` | No | `RegisterPage` — muestra u oculta el formulario |
| A2 | `POST` | `/auth/register` | No | `RegisterForm` — crear cuenta |
| A3 | `POST` | `/auth/login` | No | `LoginForm` — iniciar sesión |
| — | `POST` | `/auth/logout` | No* | `AuthContext.logout()` — revoca refresh token |

\* Logout envía el `refresh_token` en el body; no usa header `Authorization` todavía.

---

## 4. Contratos de API

### GET `/registration/status`

Respuesta:

```json
{ "enabled": false }
```

- `enabled: false` → mensaje "Registro cerrado" (estado por defecto en BD).
- El admin lo cambia con `PATCH /admin/registration` (integración del panel admin pendiente).

### POST `/auth/register`

Body (campos alineados con el formulario):

```json
{
  "nombre_completo": "Juan Perez",
  "colegio": "Colegio STEM",
  "grado": 10,
  "email": "juan@test.com",
  "telefono": "3001234567",
  "password": "password123"
}
```

Respuesta `201`:

```json
{
  "user": {
    "id": "uuid",
    "email": "juan@test.com",
    "rol": "estudiante",
    "nombre_completo": "Juan Perez",
    "colegio": "Colegio STEM",
    "grado": 10,
    "telefono": "3001234567",
    "created_at": "2026-06-23T..."
  },
  "tokens": {
    "access_token": "...",
    "refresh_token": "...",
    "token_type": "bearer"
  }
}
```

Errores relevantes:

| HTTP | `detail` (backend) | Mensaje mostrado en UI |
|------|--------------------|------------------------|
| 403 | `Student registration is currently disabled` | El registro no está abierto… |
| 409 | `Email already registered` | Este email ya está registrado. |
| 422 | validación Pydantic | Mensaje mapeado o genérico |

### POST `/auth/login`

Body:

```json
{
  "email": "juan@test.com",
  "password": "password123"
}
```

Respuesta `200`: misma forma que registro (`user` + `tokens`).

| HTTP | `detail` | Mensaje en UI |
|------|----------|---------------|
| 401 | `Invalid email or password` | Email o contraseña incorrectos. |

---

## 5. Archivos creados o modificados en el frontend

### Nuevos

| Archivo | Responsabilidad |
|---------|-----------------|
| `src/lib/api.ts` | Cliente `fetch` genérico, clase `ApiError`, mapeo de errores a español |
| `src/lib/auth.ts` | Tipos, claves de `localStorage`, helpers de sesión, rutas post-login |
| `src/lib/authApi.ts` | Funciones `getRegistrationStatus`, `registerStudent`, `login`, `logout` |
| `src/context/AuthContext.tsx` | Estado global de sesión (`user`, `setSession`, `logout`) |
| `src/hooks/useRegistrationStatus.ts` | Hook para A4 en la página de registro |
| `.env` / `.env.example` | `VITE_API_URL` |

### Modificados

| Archivo | Cambio |
|---------|--------|
| `src/components/RegisterForm.tsx` | Llama a `POST /auth/register`, guarda sesión, estados loading/error |
| `src/components/LoginForm.tsx` | Llama a `POST /auth/login`, redirige por rol |
| `src/pages/RegisterPage.tsx` | Usa `GET /registration/status` en lugar del mock `AdminContext` |
| `src/App.tsx` | Envuelve la app con `AuthProvider` |

### Sin cambios (a propósito)

| Área | Motivo |
|------|--------|
| `LandingPage` | Contenido estático; el botón REGISTRARSE sigue visible (A4 solo en `/registro`) |
| `AdminContext` | Toggle de registro en panel admin sigue mock; pendiente conectar A4 admin |
| Rutas protegidas | `/admin` aún no valida JWT en el front |

---

## 6. Sesión en el navegador

Claves en `localStorage`:

| Clave | Contenido |
|-------|-----------|
| `campus_access_token` | JWT de acceso (15 min) |
| `campus_refresh_token` | Token para renovar sesión |
| `campus_user` | JSON del usuario (`id`, `email`, `rol`, …) |

### Redirección post-login / post-registro

| Rol | Ruta |
|-----|------|
| `estudiante` | `/` |
| `juez` | `/` (placeholder hasta módulo juez) |
| `admin`, `super_admin` | `/admin` |

Función: `getPostLoginPath()` en `src/lib/auth.ts`.

---

## 7. Flujos

### Registro (A2 + A4)

```text
Usuario → /registro
    → GET /registration/status
        → false: mensaje "Registro cerrado"
        → true: RegisterForm
            → validación local (validation.ts)
            → POST /auth/register
                → 201: saveAuthSession + redirect
                → 4xx: mensaje en pantalla
```

### Login (A3)

```text
Usuario → /login → LoginForm
    → validación local
    → POST /auth/login
        → 200: saveAuthSession + redirect por rol
        → 401: "Email o contraseña incorrectos"
```

---

## 8. Cómo probar manualmente

1. Habilitar registro (admin o super admin):

```bash
# Login
curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"TU_SUPERADMIN","password":"TU_PASSWORD"}'

# Abrir registro
curl -X PATCH http://localhost:8000/api/v1/admin/registration \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"enabled": true}'
```

2. Abrir `http://localhost:5173/registro` y completar el formulario.

3. Probar login en `http://localhost:5173/login`.

4. Verificar en DevTools → Application → Local Storage las claves `campus_*`.

---

## 9. Validaciones alineadas front ↔ back

| Campo | Frontend | Backend |
|-------|----------|---------|
| `nombre_completo`, `colegio` | no vacío | min 1, trim |
| `grado` | select 9/10/11 | entero 9–11 |
| `email` | formato email | `EmailStr` |
| `telefono` | `^3\d{9}$` | igual |
| `password` | min 8 | min 8 |
| `confirmPassword` | solo UI | no se envía |

---

## 10. Pendiente (fuera de este PR)

- Proteger `/admin` en el front con JWT + rol
- Conectar toggle de registro del panel admin a `PATCH /admin/registration`
- `GET /auth/me` para restaurar sesión al recargar con token válido
- Refresh automático del access token antes de expirar
- Ocultar CTA "REGISTRARSE" en landing según `/registration/status`
- Rutas dedicadas para juez y estudiante post-hackatón

---

## 11. Diagrama

```text
┌─────────────┐     VITE_API_URL      ┌──────────────────┐
│   Vite      │ ────────────────────► │  FastAPI :8000   │
│  :5173      │     /api/v1/...       │                  │
└─────────────┘                       │  registration/   │
      │                               │  auth/register   │
      │ AuthContext                   │  auth/login      │
      ▼                               └──────────────────┘
 localStorage                              │
 campus_*                                  ▼
                                     PostgreSQL
```

---

*Última actualización: integración A2/A3 — frontend conectado al backend.*
