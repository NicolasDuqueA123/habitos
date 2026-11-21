import pg from 'pg';

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error('Falta la variable DATABASE_URL (revisa tu archivo .env o la configuración de Render)');
}

// Neon exige conexión SSL. En local (localhost) no la usamos.
const useSSL = !url.includes('localhost');

const pool = new pg.Pool({
  connectionString: url,
  ssl: useSSL ? { rejectUnauthorized: false } : false,
});

export default pool;
