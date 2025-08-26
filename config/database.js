const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'psychologist_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// اجرای یک کوئری ساده
async function executeQuery(query, params = []) {
    try {
        const [rows, fields] = await pool.execute(query, params);
        return { rows, fields };
    } catch (error) {
        console.error('❌ Database Query Error:', error.message, error.stack);
        console.error('   Query:', query);
        console.error('   Params:', params);
        throw error;
    }
}

module.exports = {
    pool,
    executeQuery
};