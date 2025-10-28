# 🚀 GUÍA RÁPIDA DE INSTALACIÓN
# Bufete Genesis Integrales - Backend

## ✅ PRE-REQUISITOS

Antes de empezar, asegúrate de tener instalado:

- Node.js v18+ (https://nodejs.org/)
- PostgreSQL 14+ (https://www.postgresql.org/)
- npm o yarn

## 📋 PASOS DE INSTALACIÓN

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar PostgreSQL

#### Opción A: Crear base de datos manualmente
```sql
CREATE DATABASE bufete_genesis;
\c bufete_genesis
-- Luego ejecutar el archivo database.sql
\i database.sql
```

#### Opción B: Usar psql desde terminal
```bash
psql -U postgres -c "CREATE DATABASE bufete_genesis;"
psql -U postgres -d bufete_genesis -f database.sql
```

### 3. Configurar variables de entorno

Copiar el archivo de ejemplo y editarlo:
```bash
cp .env.example .env
```

Editar `.env` con tus datos:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=TU_PASSWORD_AQUI
DB_DATABASE=bufete_genesis

JWT_SECRET=cambia_este_secreto_por_algo_muy_seguro_y_aleatorio
JWT_EXPIRES_IN=24h

PORT=3000
NODE_ENV=development

CORS_ORIGIN=http://localhost:4200
```

### 4. Ejecutar el backend

#### Modo desarrollo (con hot-reload):
```bash
npm run start:dev
```

#### Modo producción:
```bash
npm run build
npm run start:prod
```

El servidor estará en: http://localhost:3000/api

## 🧪 PROBAR LA API

### 1. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@bufete.com",
    "password": "admin123"
  }'
```

Respuesta:
```json
{
  "access_token": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "nombreCompleto": "Administrador",
    "email": "admin@bufete.com",
    "rol": "admin"
  }
}
```

### 2. Listar oficinas (requiere token)
```bash
curl -X GET http://localhost:3000/api/oficinas \
  -H "Authorization: Bearer <tu_token_aqui>"
```

### 3. Crear cita desde chatbot (público, no requiere token)
```bash
curl -X POST http://localhost:3000/api/citas/chatbot \
  -H "Content-Type: application/json" \
  -d '{
    "clienteId": "uuid-del-cliente",
    "abogadoId": "uuid-del-abogado",
    "areaDerechoId": "uuid-del-area",
    "tipoCasoId": "uuid-del-tipo-caso",
    "tipoCitaId": "uuid-del-tipo-cita",
    "oficinaId": "uuid-de-la-oficina",
    "fecha": "2025-11-15",
    "hora": "10:00",
    "descripcion": "Consulta desde chatbot",
    "origen": "chatbot"
  }'
```

## 🔧 COMANDOS ÚTILES

```bash
# Instalar dependencias
npm install

# Modo desarrollo
npm run start:dev

# Compilar para producción
npm run build

# Ejecutar en producción
npm run start:prod

# Formatear código
npm run format

# Ejecutar linter
npm run lint

# Ejecutar tests
npm run test
```

## 📊 VERIFICAR BASE DE DATOS

### Conectar a PostgreSQL:
```bash
psql -U postgres -d bufete_genesis
```

### Ver tablas creadas:
```sql
\dt
```

### Ver usuario admin:
```sql
SELECT * FROM usuarios;
```

### Ver oficinas:
```sql
SELECT * FROM oficinas;
```

## ⚠️ PROBLEMAS COMUNES

### Error: "connect ECONNREFUSED"
- PostgreSQL no está corriendo
- Solución: Iniciar PostgreSQL
  - Linux: `sudo systemctl start postgresql`
  - Mac: `brew services start postgresql`
  - Windows: Iniciar desde "Servicios"

### Error: "password authentication failed"
- Contraseña incorrecta en .env
- Solución: Verificar credenciales en el archivo .env

### Error: "relation 'usuarios' does not exist"
- Las tablas no se crearon
- Solución: Ejecutar el archivo database.sql

### Error: "Cannot find module"
- Faltan dependencias
- Solución: `rm -rf node_modules && npm install`

### Error: JWT secret no configurado
- Falta JWT_SECRET en .env
- Solución: Agregar JWT_SECRET en el archivo .env

## 🎯 SIGUIENTE PASO

Una vez que el backend esté funcionando:

1. El frontend Angular se conectará a: `http://localhost:3000/api`
2. N8N (chatbot) creará citas en: `POST http://localhost:3000/api/citas/chatbot`
3. Panel de admin disponible con el usuario: `admin@bufete.com` / `admin123`

## 📞 SOPORTE

Si tienes problemas, verifica:
1. ✅ PostgreSQL está corriendo
2. ✅ Base de datos y tablas existen
3. ✅ Variables de entorno están configuradas
4. ✅ Puerto 3000 está disponible
5. ✅ Dependencias instaladas correctamente

## 🔒 SEGURIDAD

**IMPORTANTE:** Antes de subir a producción:
- ✅ Cambiar JWT_SECRET por uno seguro y aleatorio
- ✅ Cambiar password del usuario admin
- ✅ Configurar CORS_ORIGIN con el dominio real
- ✅ Usar HTTPS en producción
- ✅ Configurar SSL para PostgreSQL en producción

## ✨ ¡LISTO!

Si llegaste hasta aquí, tu backend ya debería estar funcionando correctamente.

Para ver todos los endpoints disponibles, revisa el archivo README.md
