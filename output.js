// output.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Render در production SSL می‌خواهد
});

(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log("✅ Table 'users' created successfully (or already exists).");
  } catch (err) {
    // لاگ دقیق خطا برای دیباگ
    console.error("❌ Error creating 'users' table:", {
      message: err.message,
      code: err.code,
      detail: err.detail,
      where: err.where,
      schema: err.schema,
      table: err.table,
      hint: err.hint,
      stack: err.stack,
    });
    // اگر دوست داری حتی در صورت خطا هم سرور بالا بیاد، این خط رو حذف کن:
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
