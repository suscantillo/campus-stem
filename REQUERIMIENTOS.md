# Campus STEM — Documento de Visión, Alcance y Requerimientos



---

## 1. Visión

Campus STEM es un evento organizado por la rama IEEE de la Universidad del Norte cuyo objetivo es atraer a estudiantes de colegio hacia las carreras de ingeniería. Durante cuatro días (30 de junio – 3 de julio), estudiantes de distintos colegios participan en actividades didácticas: talleres, charlas y una hackatón final.

Esta aplicación web da soporte al evento. Cumple dos funciones principales:

1. **Antes y durante los primeros días:** servir de cara pública del evento (información y calendario de actividades) y gestionar el **registro** de los estudiantes participantes.
2. **El día 3:** operar la **hackatón** de principio a fin — organización de equipos, un marketplace de recursos con dinero ficticio, y un proceso de calificación por jurados controlado por los administradores.

El éxito de la aplicación se mide por que el día del evento todo funcione sin fricción: que los estudiantes se registren y entren desde su propio celular, que la hackatón fluya por sus fases sin intervención técnica, y que al final el administrador pueda descargar una tabla de posiciones confiable.

---

## 2. Tipos de usuario

|Rol|Cómo obtiene la cuenta|Qué hace|
|---|---|---|
|**Estudiante**|Se registra solo (email + contraseña + datos personales), cuando el admin tenga el registro habilitado|Ve la landing; durante la hackatón, ve su equipo y el marketplace. Si es **líder**, además compra recursos.|
|**Administrador**|Creado por el Super Admin|Gestiona registro, equipos, marketplace, presupuestos, fases de la hackatón y calificación. Descarga resultados.|
|**Juez**|Creado por el Super Admin|Solo interviene en la fase de calificación: califica a los equipos que le fueron asignados según una rúbrica.|
|**Super Admin** (desarrollador)|Cuenta raíz|Crea cuentas de administradores y jueces. Acceso total.|

---

## 3. Alcance

### 3.1 Dentro del alcance

**Cara pública / Landing**

- Página informativa estática del evento.
- Calendario de actividades por día (contenido fijo, cargado por el desarrollador).

**Registro**

- Auto-registro de estudiantes con email + contraseña.
- Datos recogidos: nombre completo, colegio, grado, email, número de teléfono.
- El administrador habilita o deshabilita el registro (disponible cualquier día del evento mientras esté habilitado).
- Autenticación de los cuatro roles.

**Módulo Hackatón (día 3)** — el corazón del sistema:

- **Equipos:** generación aleatoria de equipos (4–5 estudiantes) a partir de los estudiantes registrados, desde el panel de admin. El sistema designa un líder al azar. El admin puede modificar manualmente la composición de los equipos y reasignar al líder.
- **Marketplace:** catálogo de productos con stock limitado, gestionado por el admin (nombre, precio, stock). Cada equipo tiene un presupuesto en dinero ficticio. **Solo el líder compra;** el resto del equipo solo visualiza. Un equipo puede devolver un producto. Un equipo nunca puede gastar más de lo que tiene.
- **Presupuesto:** presupuesto inicial igual para todos los equipos. El admin puede ajustar el dinero de **cada equipo individualmente** (la validación impide dejarlo por debajo de lo ya gastado).
- **Fases controladas por el admin** (ver sección 4): el admin abre/cierra el marketplace y abre/cierra la calificación de forma independiente.
- **Calificación:** los jueces califican según una rúbrica. El admin define qué juez califica a qué equipo (por defecto, todos a todos). Una calificación enviada **no se puede modificar**.
- **Resultados:** al cerrar la calificación, el admin ve y descarga la tabla de posiciones desde su dashboard.

### 3.2 Fuera del alcance (explícito)

Esto **no** se construye en esta versión, para proteger el tiempo de desarrollo:

- Recuperación de contraseña, login con redes sociales, "recordarme".
- Inscripción a talleres/charlas específicos o control de asistencia (los estudiantes registrados participan en todas las actividades).
- Edición de la landing o el calendario desde el panel (son estáticos).
- Que estudiantes o jueces vean la tabla de posiciones (solo el admin).
- Que los productos del marketplace influyan en la calificación (son mecánicas separadas).
- Cualquier funcionalidad para los días 1 y 2 más allá de landing + registro.

---

## 4. Modelo de fases de la hackatón (máquina de estados + override administrativo)

La hackatón se modela con **compuertas (gates) independientes**, no con un único interruptor lineal. Cada compuerta es una bandera que el administrador controla:

|Compuerta|Estados|Quién la controla|Efecto|
|---|---|---|---|
|`marketplace_abierto`|abierto / cerrado|Admin|Si está abierto, los líderes pueden comprar y devolver.|
|`calificacion_abierta`|abierta / cerrada|Admin|Si está abierta, los jueces asignados pueden calificar. Al cerrarse, se revoca su acceso a calificar.|

**Flujo lógico esperado** (secuencia ideal): equipos armados → marketplace abierto → marketplace cerrado → calificación abierta → calificación cerrada → resultados disponibles.

**Override administrativo:** el admin no está obligado a seguir esa secuencia. Puede abrir o cerrar cada compuerta cuando quiera, e incluso tener ambas abiertas a la vez. La "secuencia ideal" es solo el camino por defecto; el sistema **permite** que el admin la altere. Este patrón (banderas independientes + control manual del admin) da máxima flexibilidad sin complejidad adicional.

La formación de equipos y el registro son **independientes** de estas compuertas: se pueden hacer en cualquier momento (p. ej. asignar equipo a un estudiante que se registró tarde).

---

## 5. Historias de usuario (priorizadas)

Formato: _Como [rol] quiero [acción] para [beneficio]._ Cada historia se detallará en una spec de Nivel 3 antes de construirse.

### BLOQUE A — Necesario desde el día 1 (máxima prioridad)

> Esto debe estar funcionando primero: es la cara pública y la puerta de entrada.

- **A1.** Como visitante quiero ver la información del evento y el calendario por día para saber qué actividades hay y cuándo.
- **A2.** Como estudiante quiero registrarme con mis datos (nombre, colegio, grado, email, teléfono) y una contraseña para poder participar en el evento.
- **A3.** Como estudiante quiero iniciar sesión con mi email y contraseña para acceder a la plataforma.
- **A4.** Como administrador quiero habilitar o deshabilitar el registro de estudiantes para controlar cuándo se puede inscribir la gente.
- **A5.** Como super admin quiero crear cuentas de administradores y jueces para que el equipo organizador y el jurado puedan entrar.
- **A6.** Como administrador quiero ver la lista de estudiantes registrados para tener control de quién participa.

### BLOQUE B — Módulo Hackatón, necesario para el día 3

> Esto no se necesita hasta el día 3, así que se construye después del Bloque A.

**Equipos**

- **B1.** Como administrador quiero generar equipos aleatorios (4–5 estudiantes) a partir de los registrados para organizar la hackatón rápido.
- **B2.** Como administrador quiero modificar manualmente la composición de un equipo y su líder para corregir casos especiales (registros tardíos, ausencias).
- **B3.** Como estudiante quiero ver a qué equipo pertenezco y quiénes son mis compañeros y mi líder para ubicarme en la hackatón.

**Marketplace y presupuesto**

- **B4.** Como administrador quiero gestionar el catálogo de productos (nombre, precio, stock) para definir qué recursos hay disponibles.
- **B5.** Como administrador quiero abrir o cerrar el marketplace para controlar cuándo los equipos pueden comprar.
- **B6.** Como administrador quiero ajustar el presupuesto de un equipo individual para premiarlo o corregir su saldo sin dejarlo en negativo.
- **B7.** Como líder de equipo quiero comprar productos del marketplace con el presupuesto de mi equipo para gestionar nuestros recursos.
- **B8.** Como líder de equipo quiero devolver un producto comprado para recuperar presupuesto si me equivoqué.
- **B9.** Como miembro de equipo (no líder) quiero ver el marketplace y lo que mi equipo ha comprado para estar al tanto, aunque no pueda comprar.

**Calificación y resultados**

- **B10.** Como administrador quiero asignar qué juez califica a qué equipo (por defecto todos a todos) para organizar el jurado.
- **B11.** Como administrador quiero abrir o cerrar la fase de calificación para controlar cuándo los jueces pueden evaluar.
- **B12.** Como juez quiero calificar a mis equipos asignados según una rúbrica para evaluar su desempeño.
- **B13.** Como juez quiero que mi calificación enviada quede en firme para garantizar la integridad del proceso.
- **B14.** Como administrador quiero ver y descargar la tabla de posiciones final para anunciar a los ganadores.

---

## 6. Notas técnicas iniciales (contexto, no decisiones cerradas)

- **Stack:** React + Vite + TypeScript (frontend) · FastAPI (backend) · PostgreSQL (BD).
- **Escala:** ~60 estudiantes → ~12–15 equipos → ~12–15 líderes compradores. Baja concurrencia. No requiere diseño para alta carga.
- **Concurrencia en compras:** dado el bajo número de compradores simultáneos, basta una transacción de Postgres con bloqueo de fila (`SELECT ... FOR UPDATE`) sobre el producto para evitar vender stock inexistente. No se requiere pessimistic locking elaborado.
- **Responsive obligatorio:** los estudiantes usan su propio celular el día 3. La vista de estudiante (equipo + marketplace) debe funcionar bien en móvil.
- **Roles y permisos:** cuatro roles con permisos claramente diferenciados; el control de acceso a marketplace y calificación depende de las compuertas de la sección 4.

---

## 7. Preguntas abiertas / por definir más adelante

- Detalle de la rúbrica de calificación (criterios y puntajes) — se facilitará aparte.
- Fórmula de la nota final (promedio de jueces, suma, etc.).
- Formato exacto de la descarga de resultados (PDF o CSV/Excel).
- Nombre "fancy" definitivo del dinero ficticio.
- Tiempo de sesión / expiración del token de login.