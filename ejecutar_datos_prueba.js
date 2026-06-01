const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// 1. Cargar archivo .env
const envPath = path.join(__dirname, '.env');
console.log('Cargando configuración desde:', envPath);
if (!fs.existsSync(envPath)) {
  console.error('Error: No se encontró el archivo .env en:', envPath);
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const config = {};
envContent.split(/\r?\n/).forEach(line => {
  const match = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)\s*$/);
  if (match) {
    const key = match[1].trim();
    let val = match[2].trim();
    // Remover comillas si existen
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    config[key] = val;
  }
});

// 2. Configurar conexión a PostgreSQL
const dbConfig = {
  host: config.DB_HOST || 'localhost',
  port: parseInt(config.DB_PORT || '5432', 10),
  user: config.DB_USERNAME || 'postgres',
  password: config.DB_PASSWORD || '',
  database: config.DB_DATABASE || 'bufete_genesis',
};

console.log('Configuración de Base de Datos detectada:', {
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  database: dbConfig.database,
  password: '***'
});

// 3. Leer archivo SQL
const sqlFilePath = path.join(__dirname, '../../genesis_base_Datos/04_datos_prueba_30_citas.sql');
console.log('Leyendo consultas SQL desde:', sqlFilePath);
if (!fs.existsSync(sqlFilePath)) {
  console.error('Error: No se encontró el archivo SQL en:', sqlFilePath);
  process.exit(1);
}
const sqlQueries = fs.readFileSync(sqlFilePath, 'utf8');

// 4. Conectarse y ejecutar
const client = new Client(dbConfig);

async function run() {
  try {
    await client.connect();
    console.log('Conexión a PostgreSQL establecida con éxito.');
    
    console.log('Ejecutando script de carga de datos de prueba en la base de datos...');
    
    // Escuchar avisos de PostgreSQL (RAISE NOTICE)
    client.on('notice', (msg) => {
      console.log('Postgres INFO:', msg.message);
    });

    await client.query(sqlQueries);
    console.log('\n🎉 PROCESO COMPLETADO EXITOSAMENTE');
    console.log('================================================');
    console.log('Se han insertado los clientes y las 30 citas de prueba en Mayo 2026.');
    
    // Realizar un conteo de verificación
    const resCount = await client.query("SELECT COUNT(*) FROM citas WHERE fecha >= '2026-05-01' AND fecha <= '2026-05-31'");
    console.log(`Verificación: Total de citas en Mayo 2026 en la DB: ${resCount.rows[0].count}`);

    const resUrgencia = await client.query("SELECT urgencia, COUNT(*) as total FROM citas WHERE fecha >= '2026-05-01' AND fecha <= '2026-05-31' GROUP BY urgencia ORDER BY total DESC");
    console.log('\nDistribución por Urgencia:');
    resUrgencia.rows.forEach(r => console.log(` - ${r.urgencia}: ${r.total}`));

    const resEstado = await client.query("SELECT estado, COUNT(*) as total FROM citas WHERE fecha >= '2026-05-01' AND fecha <= '2026-05-31' GROUP BY estado ORDER BY total DESC");
    console.log('\nDistribución por Estado:');
    resEstado.rows.forEach(r => console.log(` - ${r.estado}: ${r.total}`));

  } catch (err) {
    console.error('❌ Error ejecutando consultas en la base de datos:', err.message);
  } finally {
    await client.end();
    console.log('Conexión cerrada.');
  }
}

run();
