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
    const res = await client.query(`
      SELECT 
        c.id, 
        c.fecha::text as fecha_text, 
        EXTRACT(dow FROM c.fecha) AS dow,
        TO_CHAR(c.fecha, 'Day') as day_name
      FROM citas c
      WHERE EXTRACT(dow FROM c.fecha) IN (0, 6)
      LIMIT 5
    `);
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
run();
