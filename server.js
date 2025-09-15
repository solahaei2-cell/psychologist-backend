const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();

// میدل‌ورها
// CORS با تنظیمات صریح برای هدر Authorization و متدها
const corsOptions = {
    origin: [
        'https://psychologist-frontend-app.onrender.com',
        'http://localhost:3000',
        'http://localhost:5173'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
// هندل preflight به صورت سراسری
app.options('*', cors(corsOptions));
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

// endpoint برای پاک کردن همه کاربران (فقط برای تست)
app.get('/clear-users', async (req, res) => {
    try {
        const { executeQuery } = require('./config/database');
        
        // پاک کردن داده‌های مرتبط با کاربران
        await executeQuery('DELETE FROM assessment_answers');
        await executeQuery('DELETE FROM assessments');
        await executeQuery('DELETE FROM consultation_requests');
        await executeQuery('DELETE FROM user_content_progress');
        await executeQuery('DELETE FROM users');
        
        res.json({ success: true, message: 'All users and related data cleared successfully!' });
    } catch (error) {
        console.error('Clear users error:', error);
        res.status(500).json({ success: false, message: 'Failed to clear users', error: error.message });
    }
});

// endpoint عمومی برای آمار (بدون نیاز به authentication)
app.get('/api/stats/public', async (req, res) => {
    try {
        const { executeQuery } = require('./config/database');
        
        // شمارش کاربران
        const usersResult = await executeQuery('SELECT COUNT(*) as count FROM users');
        const activeUsers = usersResult[0]?.count || 0;
        
        // شمارش ارزیابی‌ها
        const assessmentsResult = await executeQuery('SELECT COUNT(*) as count FROM assessments');
        const assessments = assessmentsResult[0]?.count || 0;
        
        // شمارش درخواست‌های مشاوره
        const consultationResult = await executeQuery('SELECT COUNT(*) as count FROM consultation_requests');
        const consultations = consultationResult[0]?.count || 0;
        
        // محاسبه رضایت (فرضی بر اساس تعداد کاربران)
        const satisfaction = activeUsers > 0 ? '95%' : '0%';
        
        res.json({
            activeUsers,
            assessments,
            content: 45, // تعداد ثابت محتوا
            satisfaction
        });
    } catch (error) {
        console.error('Public stats error:', error);
        res.json({
            activeUsers: 0,
            assessments: 0,
            content: 45,
            satisfaction: '0%'
        });
    }
});

// پورت از .env یا پیشفرض 5000
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
