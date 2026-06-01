const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// 1. Cargar archivo .env
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.error('Error: No se encontró el archivo .env');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const config = {};
envContent.split(/\r?\n/).forEach(line => {
  const match = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)\s*$/);
  if (match) {
    const key = match[1].trim();
    let val = match[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    config[key] = val;
  }
});

const dbConfig = {
  host: config.DB_HOST || 'localhost',
  port: parseInt(config.DB_PORT || '5432', 10),
  user: config.DB_USERNAME || 'postgres',
  password: config.DB_PASSWORD || '',
  database: config.DB_DATABASE || 'bufete_genesis',
};

const client = new Client(dbConfig);

async function run() {
  try {
    await client.connect();
    console.log('Conexión establecida.');
    
    // Consulta para obtener citas en fin de semana
    // En PostgreSQL, EXTRACT(dow FROM fecha) o TO_CHAR(fecha, 'D') se puede usar.
    // EXTRACT(dow FROM fecha) devuelve 0 para domingo, 6 para sábado.
    const res = await client.query(`
      SELECT 
        c.id, 
        cl.nombre_completo AS cliente_nombre, 
        a.nombre AS abogado_nombre, 
        c.fecha, 
        c.hora, 
        c.estado,
        EXTRACT(dow FROM c.fecha) AS dia_semana
      FROM citas c
      JOIN clientes cl ON c.cliente_id = cl.id
      JOIN abogados a ON c.abogado_id = a.id
      WHERE EXTRACT(dow FROM c.fecha) IN (0, 6)
      ORDER BY c.fecha, c.hora
    `);
    
    console.log(`\nSe encontraron ${res.rows.length} citas en fin de semana:`);
    res.rows.forEach(r => {
      const diaStr = r.dia_semana === 6 ? 'Sábado' : 'Domingo';
      console.log(`- ID: ${r.id} | Cliente: ${r.cliente_nombre} | Abogado: ${r.abogado_nombre} | Fecha: ${r.fecha.toISOString().split('T')[0]} (${diaStr}) | Hora: ${r.hora} | Estado: ${r.estado}`);
    });
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

run();
