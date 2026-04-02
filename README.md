# 🏛️ Bufete Genesis Integrales - Backend API

Backend completo en **Nest.js** para sistema de gestión de citas de un bufete de abogados.

## 📋 Descripción

Sistema de gestión de citas que incluye:
- Gestión completa de citas (CRUD)
- Autenticación con JWT
- Roles de usuario (admin y asistente_legal)
- Integración con chatbot (N8N) para creación automática de citas
- Analíticas y estadísticas
- Gestión de clientes, abogados, oficinas y catálogos

## 🚀 Tecnologías

- **Framework:** NestJS 10
- **Base de Datos:** PostgreSQL
- **ORM:** TypeORM
- **Autenticación:** JWT (Passport)
- **Validación:** class-validator
- **Password Hashing:** bcrypt

## 📦 Instalación

### 1. Clonar el repositorio

```bash
git clone <tu-repositorio>
cd bufete-genesis-backend
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crear archivo `.env` basado en `.env.example`:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=tu_password
DB_DATABASE=bufete_genesis

# JWT Configuration
JWT_SECRET=tu_secreto_super_seguro
JWT_EXPIRES_IN=24h

# Application
PORT=3000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:4200
```

### 4. Base de datos

**IMPORTANTE:** Las tablas ya deben existir en PostgreSQL. Este backend **NO** crea las tablas automáticamente (`synchronize: false`).

Si necesitas el script SQL para crear las tablas, contacta al administrador.

### 5. Ejecutar la aplicación

```bash
# Modo desarrollo
npm run start:dev

# Modo producción
npm run build
npm run start:prod
```

El servidor estará disponible en: `http://localhost:3000/api`

## 📚 Documentación de API

### Autenticación

#### POST /api/auth/login
Login de usuario

**Body:**
```json
{
  "email": "admin@bufete.com",
  "password": "123456"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "nombreCompleto": "Admin User",
    "email": "admin@bufete.com",
    "rol": "admin"
  }
}
```

#### POST /api/auth/register
Registrar nuevo usuario (solo admin)

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "nombreCompleto": "Juan Pérez",
  "email": "juan@bufete.com",
  "password": "123456",
  "rol": "asistente_legal"
}
```

#### GET /api/auth/profile
Obtener perfil del usuario logueado

**Headers:** `Authorization: Bearer <token>`

---

### Citas

#### POST /api/citas
Crear cita (desde el panel web)

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "clienteId": "uuid",
  "abogadoId": "uuid",
  "areaDerechoId": "uuid",
  "tipoCasoId": "uuid",
  "tipoCitaId": "uuid",
  "oficinaId": "uuid",
  "fecha": "2025-11-15",
  "hora": "10:00",
  "descripcion": "Consulta inicial de divorcio",
  "urgencia": "media",
  "origen": "panel_web"
}
```

#### POST /api/citas/chatbot
Crear cita desde el chatbot (N8N) - **ENDPOINT PÚBLICO**

**Body:**
```json
{
  "clienteId": "uuid",
  "abogadoId": "uuid",
  "areaDerechoId": "uuid",
  "tipoCasoId": "uuid",
  "tipoCitaId": "uuid",
  "oficinaId": "uuid",
  "fecha": "2025-11-15",
  "hora": "10:00",
  "descripcion": "Consulta desde WhatsApp",
  "urgencia": "alta",
  "origen": "chatbot"
}
```

#### GET /api/citas
Listar todas las citas con filtros

**Query Params:**
- `fechaInicio`: 2025-11-01
- `fechaFin`: 2025-11-30
- `estado`: pendiente | confirmada | completada | cancelada | no_asistio
- `abogadoId`: uuid
- `clienteId`: uuid
- `busqueda`: texto (busca en nombre de cliente o abogado)

#### GET /api/citas/:id
Ver detalle de una cita

#### PUT /api/citas/:id
Editar cita

#### PATCH /api/citas/:id/estado
Cambiar estado de una cita

**Body:**
```json
{
  "estado": "confirmada",
  "motivoCancelacion": "Cliente canceló" // opcional
}
```

#### DELETE /api/citas/:id
Cancelar cita

#### GET /api/citas/abogado/:id
Listar citas de un abogado

#### GET /api/citas/cliente/:id
Listar citas de un cliente

---

### Clientes

#### GET /api/clientes
Listar clientes

**Query Params:**
- `busqueda`: texto

#### GET /api/clientes/:id
Ver detalle de cliente

#### POST /api/clientes
Crear cliente

#### PUT /api/clientes/:id
Actualizar cliente

#### DELETE /api/clientes/:id
Eliminar cliente

---

### Abogados

#### GET /api/abogados
Listar abogados

**Query Params:**
- `activo`: true | false
- `busqueda`: texto

#### GET /api/abogados/:id
Ver detalle de abogado

#### POST /api/abogados
Crear abogado (solo admin)

#### PUT /api/abogados/:id
Actualizar abogado (solo admin)

#### DELETE /api/abogados/:id
Eliminar abogado (solo admin)

---

### Catálogos

#### GET /api/oficinas
Listar oficinas

#### GET /api/areas-derecho
Listar áreas de derecho

#### GET /api/tipos-caso
Listar tipos de caso

**Query Params:**
- `areaDerechoId`: uuid (filtrar por área)

#### GET /api/tipos-cita
Listar tipos de cita

---

### Reportes

#### GET /api/reportes/casos-mas-solicitados
Casos más solicitados

**Query Params:**
- `mes`: 1-12
- `anio`: 2025

#### GET /api/reportes/abogados-mas-solicitados
Abogados más solicitados

#### GET /api/reportes/estadisticas-mes
Estadísticas del mes

**Query Params (requeridos):**
- `mes`: 1-12
- `anio`: 2025

#### GET /api/reportes/areas-mas-solicitadas
Áreas de derecho más solicitadas

---

## 🔐 Autenticación y Autorización

- Todas las rutas están protegidas con JWT excepto:
  - `POST /api/auth/login`
  - `POST /api/citas/chatbot`

- **Roles:**
  - `admin`: Acceso total
  - `asistente_legal`: Acceso a citas, clientes, abogados (solo lectura en abogados)

## 📊 Estructura del Proyecto

```
src/
├── auth/                 # Módulo de autenticación
├── usuarios/            # Gestión de usuarios del panel
├── clientes/            # Gestión de clientes
├── abogados/            # Gestión de abogados
├── citas/               # Gestión de citas (PRINCIPAL)
├── oficinas/            # Catálogo de oficinas
├── areas-derecho/       # Catálogo de áreas de derecho
├── tipos-caso/          # Catálogo de tipos de caso
├── tipos-cita/          # Catálogo de tipos de cita
├── reportes/            # Reportes y estadísticas
├── entities/            # Entidades TypeORM
├── config/              # Configuraciones
└── main.ts              # Punto de entrada
```

## ⚙️ Validaciones Implementadas

- ✅ No se pueden crear citas en fechas pasadas
- ✅ No se pueden crear 2 citas para el mismo abogado a la misma hora
- ✅ Validación de existencia de relaciones (cliente, abogado, etc.)
- ✅ Validación de abogado activo
- ✅ No se pueden editar citas canceladas o completadas
- ✅ Validación de formatos (email, hora, etc.)

## 🔧 Scripts Disponibles

```bash
npm run start          # Iniciar en modo normal
npm run start:dev      # Iniciar en modo desarrollo (watch)
npm run start:prod     # Iniciar en producción
npm run build          # Compilar proyecto
npm run lint           # Ejecutar linter
npm run format         # Formatear código
npm run test           # Ejecutar tests
```

## 🌐 Integración con N8N

Para que el chatbot de N8N cree citas automáticamente:

1. Usar el endpoint público: `POST /api/citas/chatbot`
2. El campo `origen` se fija automáticamente como "chatbot"
3. El campo `creadoPorUsuarioId` será NULL
4. No requiere autenticación JWT

## 📝 Notas Importantes

- **Contraseñas:** Se hashean con bcrypt (salt rounds: 10)
- **UUIDs:** Todas las entidades usan UUID v4
- **CORS:** Configurado para permitir el frontend en el puerto 4200
- **Timestamps:** Todas las entidades tienen `createdAt` y `updatedAt`
- **Soft Delete:** No implementado, los registros se eliminan físicamente

## 🐛 Troubleshooting

### Error de conexión a la base de datos
- Verificar que PostgreSQL esté corriendo
- Verificar credenciales en `.env`
- Verificar que la base de datos exista

### Error "synchronize: false"
- Las tablas deben existir previamente en PostgreSQL
- NO se crean automáticamente

### Error de JWT
- Verificar que JWT_SECRET esté configurado en `.env`
- Verificar que el token no haya expirado

## 👨‍💻 Desarrollador

Bufete Genesis Integrales

## 📄 Licencia

MIT
