-- ============================================
-- SCRIPT DE CREACIÓN DE BASE DE DATOS
-- Bufete Genesis Integrales
-- ============================================

-- Crear la base de datos (ejecutar como superusuario)
-- CREATE DATABASE bufete_genesis;

-- Extensión para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLAS
-- ============================================

-- 1. Tabla de Oficinas
CREATE TABLE oficinas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL,
    direccion TEXT,
    telefono VARCHAR(20),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Áreas de Derecho
CREATE TABLE areas_derecho (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(50) NOT NULL,
    descripcion TEXT,
    color VARCHAR(20),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla de Tipos de Caso
CREATE TABLE tipos_caso (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    area_derecho_id UUID NOT NULL REFERENCES areas_derecho(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabla de Tipos de Cita
CREATE TABLE tipos_cita (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    duracion_estimada_minutos INTEGER,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabla de Abogados
CREATE TABLE abogados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    especialidad VARCHAR(50),
    email VARCHAR(255),
    telefono VARCHAR(20),
    oficina_id UUID REFERENCES oficinas(id) ON DELETE SET NULL,
    plataforma_notificacion VARCHAR(20),
    user_id_telegram VARCHAR(100),
    numero_whatsapp VARCHAR(20),
    recibir_notificaciones BOOLEAN DEFAULT TRUE,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tabla de Clientes
CREATE TABLE clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre_completo VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    email VARCHAR(255),
    plataforma VARCHAR(20),
    user_id_plataforma VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Tabla de Usuarios (para login del panel)
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre_completo VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(20) DEFAULT 'asistente_legal',
    activo BOOLEAN DEFAULT TRUE,
    ultimo_acceso TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Tabla de Citas (PRINCIPAL)
CREATE TABLE citas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    abogado_id UUID NOT NULL REFERENCES abogados(id) ON DELETE CASCADE,
    area_derecho_id UUID NOT NULL REFERENCES areas_derecho(id) ON DELETE CASCADE,
    tipo_caso_id UUID NOT NULL REFERENCES tipos_caso(id) ON DELETE CASCADE,
    tipo_cita_id UUID NOT NULL REFERENCES tipos_cita(id) ON DELETE CASCADE,
    oficina_id UUID NOT NULL REFERENCES oficinas(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    descripcion TEXT,
    notas_adicionales TEXT,
    estado VARCHAR(50) DEFAULT 'pendiente',
    urgencia VARCHAR(20) DEFAULT 'media',
    origen VARCHAR(50) NOT NULL,
    telefono_contacto VARCHAR(20),
    recordatorio_enviado BOOLEAN DEFAULT FALSE,
    fecha_recordatorio_enviado TIMESTAMP,
    creado_por_usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    cancelada_por_usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    motivo_cancelacion TEXT,
    fecha_cancelacion TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Tabla de Notificaciones
CREATE TABLE notificaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo VARCHAR(50) NOT NULL,
    destinatario_tipo VARCHAR(20) NOT NULL,
    destinatario_id UUID NOT NULL,
    cita_id UUID REFERENCES citas(id) ON DELETE CASCADE,
    plataforma VARCHAR(20) NOT NULL,
    mensaje TEXT NOT NULL,
    estado VARCHAR(20) DEFAULT 'pendiente',
    error_mensaje TEXT,
    enviado_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ÍNDICES PARA MEJORAR RENDIMIENTO
-- ============================================

CREATE INDEX idx_citas_fecha ON citas(fecha);
CREATE INDEX idx_citas_estado ON citas(estado);
CREATE INDEX idx_citas_abogado_id ON citas(abogado_id);
CREATE INDEX idx_citas_cliente_id ON citas(cliente_id);
CREATE INDEX idx_citas_origen ON citas(origen);
CREATE INDEX idx_tipos_caso_area_derecho_id ON tipos_caso(area_derecho_id);
CREATE INDEX idx_abogados_oficina_id ON abogados(oficina_id);
CREATE INDEX idx_notificaciones_cita_id ON notificaciones(cita_id);

-- ============================================
-- DATOS INICIALES
-- ============================================

-- Usuario Admin por defecto
-- Password: admin123 (hasheado con bcrypt)
INSERT INTO usuarios (nombre_completo, email, password, rol, activo) VALUES
('Administrador', 'admin@bufete.com', '$2b$10$EIXYGJx5IvDzqvQvP/Z3M.xH0qKx7FRo6t5qN8kfGP4Xq6YZX8jXW', 'admin', TRUE);

-- Oficinas
INSERT INTO oficinas (nombre, direccion, telefono, activo) VALUES
('Oficina Principal', 'Av. Principal #123, La Paz', '2-2123456', TRUE),
('Sucursal El Alto', 'Calle 16 de Julio #456, El Alto', '2-2987654', TRUE),
('Sucursal Zona Sur', 'Av. Montenegro #789, La Paz', '2-2456789', TRUE);

-- Áreas de Derecho
INSERT INTO areas_derecho (nombre, descripcion, color, activo) VALUES
('Derecho Familiar', 'Divorcios, custodia, pensiones alimenticias', '#FF6B6B', TRUE),
('Derecho Civil', 'Contratos, propiedad, arrendamientos', '#4ECDC4', TRUE),
('Derecho Penal', 'Denuncias, defensa penal, querellas', '#FFE66D', TRUE),
('Derecho Laboral', 'Despidos, liquidaciones, demandas laborales', '#95E1D3', TRUE);

-- Tipos de Caso (relacionados con Áreas de Derecho)
-- Nota: Necesitas reemplazar los UUIDs con los IDs reales generados
-- Ejecutar después: SELECT id, nombre FROM areas_derecho;

-- Tipos de Cita
INSERT INTO tipos_cita (nombre, descripcion, duracion_estimada_minutos, activo) VALUES
('Consulta Inicial', 'Primera consulta con el cliente', 30, TRUE),
('Audiencia', 'Asistencia a audiencia judicial', 120, TRUE),
('Firma de Documentos', 'Firma de contratos y documentos legales', 30, TRUE),
('Seguimiento de Caso', 'Reunión de seguimiento del caso', 45, TRUE),
('Consulta Virtual', 'Consulta por videollamada', 30, TRUE);

-- Abogados (necesitas reemplazar el oficina_id con un UUID real)
-- Ejecutar después: SELECT id, nombre FROM oficinas;

-- Ejemplo de creación de abogados (reemplaza 'UUID_OFICINA_1' con el ID real)
/*
INSERT INTO abogados (nombre, especialidad, email, telefono, oficina_id, plataforma_notificacion, recibir_notificaciones, activo) VALUES
('Dr. Carlos Mendoza', 'Derecho Familiar', 'cmendoza@bufete.com', '72345678', 'UUID_OFICINA_1', 'whatsapp', TRUE, TRUE),
('Dra. María López', 'Derecho Civil', 'mlopez@bufete.com', '72456789', 'UUID_OFICINA_1', 'telegram', TRUE, TRUE),
('Dr. Juan Pérez', 'Derecho Penal', 'jperez@bufete.com', '72567890', 'UUID_OFICINA_2', 'whatsapp', TRUE, TRUE);
*/

-- ============================================
-- COMENTARIOS SOBRE LAS TABLAS
-- ============================================

COMMENT ON TABLE citas IS 'Tabla principal que almacena todas las citas del bufete';
COMMENT ON TABLE usuarios IS 'Usuarios del panel administrativo (NO incluye abogados)';
COMMENT ON TABLE abogados IS 'Abogados del bufete (NO tienen acceso al panel)';
COMMENT ON TABLE clientes IS 'Clientes que solicitan citas';
COMMENT ON TABLE notificaciones IS 'Registro de notificaciones enviadas';

-- ============================================
-- FINALIZADO
-- ============================================

-- Para verificar que todo se creó correctamente:
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
