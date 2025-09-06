// migration.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 20000,
    keepAlive: true
});

// تابع اصلی migration
async function migrate() {
    console.log('🚀 Running migration...');

    const client = await pool.connect();

    try {
        console.log('✅ اتصال به دیتابیس برقرار شد');

        // ایجاد جدول users اگر وجود ندارد
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

        // اضافه کردن ستون‌ها اگر وجود ندارند
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

        await client.query('BEGIN');
        await client.query(createUsersTable);
        await client.query(addColumns);
        await client.query(createUpdateFunc);
        await client.query(createUpdateTrigger);
        await client.query('COMMIT');

        console.log('✅ Migration completed successfully: users table is ready.');
        return { success: true, message: 'Migration executed successfully!' };
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed with details:', err);
        return { success: false, message: 'Migration failed', error: err.message };
    } finally {
        client.release();
    }
}

// export تابع برای استفاده در route
module.exports = { migrate };
