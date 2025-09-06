// migration.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 20000,
    keepAlive: true
});

async function migrate() {
    console.log('🚀 Running migration...');

    // چک اتصال به دیتابیس
    try {
        await testConnection();
    } catch (error) {
        console.error('❌ Migration failed due to connection error');
        return;
    }

    // کوئری ساخت جدول users
    const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            full_name TEXT,
            mobile VARCHAR(20),
            gender VARCHAR(10),
            acceptTerms BOOLEAN DEFAULT FALSE,
            phone TEXT,
            verification_token TEXT,
            is_verified BOOLEAN DEFAULT FALSE,
            is_active BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            last_login TIMESTAMPTZ,
            last_activity TIMESTAMPTZ
        );
    `;

    // اضافه کردن ستون‌های جدید اگه جدول از قبل وجود داره
    const addColumns = `
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS mobile VARCHAR(20),
        ADD COLUMN IF NOT EXISTS gender VARCHAR(10),
        ADD COLUMN IF NOT EXISTS acceptTerms BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS phone TEXT,
        ADD COLUMN IF NOT EXISTS verification_token TEXT,
        ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS last_activity TIMESTAMPTZ;
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
        END   $$;
    `;

    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        await client.query(createUsersTable);
        await client.query(addColumns);
        await client.query(createUpdateFunc);
        await client.query(createUpdateTrigger);
        await client.query('COMMIT');
        console.log('✅ Migration completed successfully: users table is ready.');
    } catch (err) {
        await client.query('ROLLBACK');
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
        client.release();
        await pool.end();
    }
}

async function testConnection() {
    try {
        const client = await pool.connect();
        console.log('✅ اتصال به دیتابیس برقرار شد');
        client.release();
        return true;
    } catch (error) {
        console.error('❌ خطا در اتصال به دیتابیس:', error.message);
        return false;
    }
}

migrate().catch((err) => {
    console.error('❌ Unhandled error:', err);
    process.exitCode = 1;
});

process.on('unhandledRejection', (reason) => {
    console.error('❌ UnhandledRejection:', reason);
});
