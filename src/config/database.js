const { Pool } = require('pg');

const isRender = process.env.DATABASE_URL?.includes('render.com');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isRender || process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

pool.on('error', (err) => {
  console.error('Database pool error:', err);
});

const query = (text, params) => pool.query(text, params);

const getClient = () => pool.connect();

module.exports = { pool, query, getClient };
