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
        const users = await executeQuery('SELECT COUNT(*) FROM users WHERE is_active = TRUE');
        const assessments = await executeQuery('SELECT COUNT(*) FROM assessments');
        const content = await executeQuery('SELECT COUNT(*) FROM content_library WHERE is_published = TRUE');

        res.json({
            success: true,
            data: {
                activeUsers: parseInt(users.rows[0].count),
                assessments: parseInt(assessments.rows[0].count),
                content: parseInt(content.rows[0].count),
                satisfaction: '95%'
            }
        });
    } catch (err) {
        console.error('Error fetching public stats:', err);
        res.status(500).json({ success: false, message: 'مشکل در دریافت آمار عمومی' });
    }
});

module.exports = router;
