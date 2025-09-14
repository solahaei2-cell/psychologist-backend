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

module.exports = router;
