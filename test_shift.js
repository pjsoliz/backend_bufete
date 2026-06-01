const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const config = {};
envContent.split(/\r?\n/).forEach(line => {
  const match = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)\s*$/);
  if (match) {
    config[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
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
    
    // Obtener citas de fin de semana con su fecha propuesta de lunes
    const res = await client.query(`
      SELECT 
        c.id, 
        c.fecha::text as fecha_original, 
        c.hora,
        c.abogado_id,
        a.nombre as abogado_nombre,
        cl.nombre_completo as cliente_nombre,
        EXTRACT(dow FROM c.fecha) AS dow,
        (CASE 
          WHEN EXTRACT(dow FROM c.fecha) = 6 THEN (c.fecha + INTERVAL '2 days')::date
          WHEN EXTRACT(dow FROM c.fecha) = 0 THEN (c.fecha + INTERVAL '1 day')::date
        END)::text AS fecha_nueva
      FROM citas c
      JOIN abogados a ON c.abogado_id = a.id
      JOIN clientes cl ON c.cliente_id = cl.id
      WHERE EXTRACT(dow FROM c.fecha) IN (0, 6)
    `);
    
    console.log('Análisis de traslado de citas de fin de semana a lunes:\n');
    
    for (const row of res.rows) {
      // Verificar si hay conflicto para ese abogado en la nueva fecha y misma hora
      const conflictRes = await client.query(`
        SELECT c.id, cl.nombre_completo as cliente, c.estado
        FROM citas c
        JOIN clientes cl ON c.cliente_id = cl.id
        WHERE c.abogado_id = $1 
          AND c.fecha = $2::date 
          AND c.hora = $3
          AND c.id <> $4
          AND c.estado IN ('pendiente', 'confirmada')
      `, [row.abogado_id, row.fecha_nueva, row.hora, row.id]);
      
      const dayName = row.dow === '6' ? 'Sábado' : 'Domingo';
      console.log(`Cita ${row.id}:`);
      console.log(` - Cliente: ${row.cliente_nombre}`);
      console.log(` - Abogado: ${row.abogado_nombre}`);
      console.log(` - Fecha original: ${row.fecha_original} (${dayName}) a las ${row.hora}`);
      console.log(` - Fecha nueva propuesta: ${row.fecha_nueva} (Lunes)`);
      
      if (conflictRes.rows.length > 0) {
        console.log(` ⚠️ ¡CONFLICTO DETECTADO! Ya existe una cita activa en ese horario:`);
        conflictRes.rows.forEach(cr => {
          console.log(`   - Cita ID: ${cr.id} | Cliente: ${cr.cliente} | Estado: ${cr.estado}`);
        });
      } else {
        console.log(` ✅ Sin conflictos en este horario.`);
      }
      console.log('----------------------------------------------------');
    }
    
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
run();
