// config/database.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 20000,
    keepAlive: true
});

async function executeQuery(query, params = []) {
    const client = await pool.connect();
    try {
        console.log('Executing query:', query, 'with params:', params);
        const result = await client.query(query, params);
        return result;
    } catch (error) {
        console.error('❌ Database Query Error:', error.message, error.stack);
        console.error('   Query:', query);
        console.error('   Params:', params);
        throw error;
    } finally {
        client.release();
    }
}

module.exports = { executeQuery, pool };