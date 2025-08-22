// migration.js
const { pool } = require('./config/database');

async function migrate() {
  console.log('🚀 Running migration...');

  // چک اتصال به دیتابیس
  const connection = await pool.connect();
  try {
    // کوئری ساخت جدول users
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    // تابع و تریگر برای آپدیت خودکار updated_at
    const createUpdateFunc = `
      CREATE OR REPLACE FUNCTION set_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `;

    const createUpdateTrigger = `
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_trigger WHERE tgname = 'users_set_updated_at'
        ) THEN
          CREATE TRIGGER users_set_updated_at
          BEFORE UPDATE ON users
          FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
        END IF;
      END $$;
    `;

    // آغاز تراکنش
    await connection.query('BEGIN');

    // اجرای کوئری‌ها
    await connection.query(createUsersTable);
    await connection.query(createUpdateFunc);
    await connection.query(createUpdateTrigger);

    // پایان تراکنش
    await connection.query('COMMIT');
    console.log('✅ Migration completed successfully: users table is ready.');

  } catch (err) {
    await connection.query('ROLLBACK');
    console.error('❌ Migration failed with details:');
    console.error({
      message: err.message,
      code: err.code,
      detail: err.detail,
      schema: err.schema,
      table: err.table,
      hint: err.hint,
      stack: err.stack
    });
    process.exitCode = 1;
  } finally {
    connection.release();
    await pool.end(); // بستن اتصال‌ها
  }
}

migrate().catch((err) => {
  console.error('❌ Unhandled error:', err);
  process.exitCode = 1;
});

// گرفتن خطاهای promise که جایی catch نشدن
process.on('unhandledRejection', (reason) => {
  console.error('❌ UnhandledRejection:', reason);
});