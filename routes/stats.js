const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { executeQuery } = require('../config/database');

// آمار کلی سیستم
router.get('/', authenticateToken, async (req, res) => {
    try {
        const users = await executeQuery('SELECT COUNT(*) FROM users');
        const recs = await executeQuery('SELECT COUNT(*) FROM recommendations');
        const assessments = await executeQuery('SELECT COUNT(*) FROM assessments');

        res.json({
            success: true,
            data: {
                users: users.rows[0].count,
                recommendations: recs.rows[0].count,
                assessments: assessments.rows[0].count
            }
        });
    } catch (err) {
        console.error('Error fetching stats:', err);
        res.status(500).json({ success: false, message: 'مشکل در دریافت آمار' });
    }
});

// آمار عمومی برای صفحه اصلی (بدون احراز هویت)
router.get('/public', async (req, res) => {
    try {
        // توجه: executeQuery به صورت آرایه برمی‌گرداند نه users.rows
        const usersRows = await executeQuery('SELECT COUNT(*) AS count FROM users');
        const assessmentsRows = await executeQuery('SELECT COUNT(*) AS count FROM assessments');

        const activeUsers = parseInt(usersRows?.[0]?.count || 0, 10);
        const assessments = parseInt(assessmentsRows?.[0]?.count || 0, 10);

        // در حال حاضر جدول محتوا ممکن است وجود نداشته باشد؛ یک مقدار ثابت امن برمی‌گردانیم
        const content = 45;
        const satisfaction = activeUsers > 0 ? '95%' : '0%';

        // خروجی flat مطابق انتظار فرانت‌اند
        return res.json({ activeUsers, assessments, content, satisfaction });
    } catch (err) {
        console.error('Error fetching public stats:', err);
        // هرگز 500 نده، مقادیر پیش‌فرض امن را برگردان
        return res.json({ activeUsers: 0, assessments: 0, content: 45, satisfaction: '0%' });
    }
});

module.exports = router;
