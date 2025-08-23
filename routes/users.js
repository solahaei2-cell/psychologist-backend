const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { executeQuery } = require('../config/database');

// گرفتن پروفایل کاربر
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const user = await executeQuery(
            'SELECT id, email, full_name, phone, total_points FROM users WHERE id = $1',
            [req.user.userId]
        );
        res.json({ success: true, data: user[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطا در بارگذاری پروفایل' });
    }
});

module.exports = router;