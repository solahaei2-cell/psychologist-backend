// database.js
const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '', // اجازه می‌ده پسورد خالی هم کار کنه
    database: process.env.DB_NAME || 'psychologist_ai',
    port: process.env.DB_PORT || 3306,
    charset: 'utf8mb4',
    timezone: '+00:00'
};

// ساختن pool برای مدیریت connection
const pool = mysql.createPool({
    ...dbConfig,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// تست اتصال به دیتابیس
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ اتصال به دیتابیس برقرار شد');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ خطا در اتصال به دیتابیس:', error.message);
        return false;
    }
}

// اجرای یک کوئری ساده
async function executeQuery(query, params = []) {
    try {
        const [rows] = await pool.query(query, params);
        return rows;
    } catch (error) {
        console.error('❌ Database Query Error:', error.message);
        console.error('   Query:', query);
        console.error('   Params:', params);
        throw error;
    }
}

// اجرای مجموعه‌ای از کوئری‌ها در یک تراکنش
async function executeTransaction(queries) {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const results = [];
        for (const { query, params } of queries) {
            const [result] = await connection.query(query, params);
            results.push(result);
        }

        await connection.commit();
        return results;
    } catch (error) {
        await connection.rollback();
        console.error('❌ Transaction Error:', error.message);
        throw error;
    } finally {
        connection.release();
    }
}

module.exports = {
    pool,
    executeQuery,
    executeTransaction,
    testConnection
};
