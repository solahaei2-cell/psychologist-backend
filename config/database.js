const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL, // مستقیم از DATABASE_URL استفاده کن
    ssl: { rejectUnauthorized: false }, // برای Render لازم است
    connectionTimeoutMillis: 20000, // افزایش زمان اتصال برای جلوگیری از ETIMEDOUT
    keepAlive: true // نگه داشتن اتصال برای پایداری
});

// تست اتصال به دیتابیس
async function testConnection() {
    try {
        const client = await pool.connect();
        console.log('✅ اتصال به دیتابیس برقرار شد');
        client.release();
        return true;
    } catch (error) {
        console.error('❌ خطا در اتصال به دیتابیس:', error.message, error.stack);
        return false;
    }
}

// اجرای یک کوئری ساده
async function executeQuery(query, params = []) {
    try {
        const result = await pool.query(query, params);
        return result; // همه اطلاعات: rows, rowCount, fields...
    } catch (error) {
        console.error('❌ Database Query Error:', error.message, error.stack);
        console.error('   Query:', query);
        console.error('   Params:', params);
        throw error;
    }
}

// اجرای مجموعه‌ای از کوئری‌ها در یک تراکنش
async function executeTransaction(queries) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const results = [];
        for (const { query, params } of queries) {
            const result = await client.query(query, params);
            results.push(result);
        }
        await client.query('COMMIT');
        return results;
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Transaction Error:', error.message, error.stack);
        throw error;
    } finally {
        client.release();
    }
}

module.exports = {
    pool,
    executeQuery,
    executeTransaction,
    testConnection
};