const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();

// میدل‌ورها
app.use(cors({
    origin: [
        'https://psychologist-frontend-app.onrender.com',
        'http://localhost:3000',
        'http://localhost:5173'
    ],
    credentials: true
}));
app.use(bodyParser.json());

// 📌 routeها
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/recommendations', require('./routes/recommendations'));
app.use('/api/assessments', require('./routes/assessments'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/content', require('./routes/content'));
app.use('/api/consultation', require('./routes/consultation'));

// تست سالم بودن سرور
app.get('/', (req, res) => {
    res.send('✅ Server is running...');
});

// endpoint برای اجرای migration ها (فقط برای production setup)
app.get('/setup-database', async (req, res) => {
    try {
        const { runMigrations } = require('./migrations/run_migrations');
        await runMigrations();
        res.json({ success: true, message: 'Database setup completed successfully!' });
    } catch (error) {
        console.error('Database setup error:', error);
        res.status(500).json({ success: false, message: 'Database setup failed', error: error.message });
    }
});

// پورت از .env یا پیشفرض 5000
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
