const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { executeQuery } = require('../config/database');

// گرفتن چت‌های کاربر
router.get('/', authenticateToken, async (req, res) => {
    try {
        const [chats] = await executeQuery(
            'SELECT id, session_type, started_at FROM chat_sessions WHERE user_id = ? ORDER BY started_at DESC',
            [req.user.userId]
        );
        res.json({ success: true, data: chats });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطا در بارگذاری چت‌ها' });
    }
});

module.exports = router;