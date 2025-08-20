const express = require('express');
const router = express.Router();
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { executeQuery } = require('../config/database');

// گرفتن همه محتواها (با اختیاری احراز هویت)
router.get('/', optionalAuth, async (req, res) => {
    try {
        const [contents] = await executeQuery(
            'SELECT id, title, content_type, category, duration_minutes, view_count, like_count FROM content_library WHERE is_published = TRUE ORDER BY view_count DESC'
        );
        res.json({ success: true, data: contents });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطا در بارگذاری محتواها' });
    }
});

// گرفتن یک محتوا خاص
router.get('/:id', optionalAuth, async (req, res) => {
    try {
        const [contents] = await executeQuery(
            'SELECT * FROM content_library WHERE id = ? AND is_published = TRUE',
            [req.params.id]
        );
        if (contents.length === 0) {
            return res.status(404).json({ success: false, message: 'محتوا یافت نشد' });
        }
        res.json({ success: true, data: contents[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطا در بارگذاری محتوا' });
    }
});

// لایک کردن محتوا
router.post('/:id/like', authenticateToken, async (req, res) => {
    try {
        await executeQuery(
            'UPDATE content_library SET like_count = like_count + 1 WHERE id = ?',
            [req.params.id]
        );
        res.json({ success: true, message: 'محتوا لایک شد' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطا در لایک کردن' });
    }
});

// تکمیل محتوا
router.post('/:id/complete', authenticateToken, async (req, res) => {
    try {
        await executeQuery(
            'INSERT INTO user_progress (user_id, activity_type, related_content_id, points_earned) VALUES (?, ?, ?, ?)',
            [req.user.userId, 'content_completed', req.params.id, 10]
        );
        res.json({ success: true, message: 'محتوا تکمیل شد' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطا در تکمیل محتوا' });
    }
});

module.exports = router;