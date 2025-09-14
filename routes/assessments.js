const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { executeQuery } = require('../config/database');

// تاریخچه ارزیابی‌های کاربر
router.get('/history', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id; // از توکن
        const result = await executeQuery(
            'SELECT id, assessment_type, total_score, result, created_at FROM assessments WHERE user_id=$1 ORDER BY created_at DESC',
            [userId]
        );
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error('Error fetching assessment history:', err);
        res.status(500).json({ success: false, message: 'مشکل در تاریخچه ارزیابی‌ها' });
    }
});

module.exports = router;
