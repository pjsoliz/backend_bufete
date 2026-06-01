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
    console.log('Conexión establecida. Iniciando actualización...');
    
    const updateRes = await client.query(`
      UPDATE citas
      SET fecha = CASE 
          WHEN EXTRACT(dow FROM fecha) = 6 THEN (fecha + INTERVAL '2 days')::date
          WHEN EXTRACT(dow FROM fecha) = 0 THEN (fecha + INTERVAL '1 day')::date
          ELSE fecha
      END,
      updated_at = CURRENT_TIMESTAMP
      WHERE EXTRACT(dow FROM fecha) IN (0, 6)
      RETURNING id, fecha, hora, estado
    `);
    
    console.log(`\n🎉 ¡Actualización completada! Se modificaron ${updateRes.rows.length} citas.`);
    console.log('Citas trasladadas con éxito:');
    updateRes.rows.forEach(r => {
      console.log(` - ID: ${r.id} | Nueva Fecha: ${r.fecha.toISOString().split('T')[0]} | Hora: ${r.hora} | Estado: ${r.estado}`);
    });
    
  } catch (err) {
    console.error('Error durante la actualización:', err.message);
  } finally {
    await client.end();
  }
}
run();
