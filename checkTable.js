// checkTable.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 20000,
    keepAlive: true
});

async function checkUsersTable() {
  const query = `
      SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public'
          AND table_name = 'users'
      ) AS table_exists;
  `;
  try {
      const client = await pool.connect();
      const result = await client.query(query);
      const exists = result.rows[0].table_exists;
      console.log(`✅ جدول users ${exists ? 'وجود داره' : 'وجود نداره'}`);
      client.release();
  } catch (error) {
      console.error('❌ خطا در چک کردن جدول:', error.message, error.stack);
  } finally {
      await pool.end();
  }
}

checkUsersTable().then(() => process.exit(0));