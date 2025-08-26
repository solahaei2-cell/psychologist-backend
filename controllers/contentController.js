const { executeQuery } = require('../config/database');

// گرفتن محتواها
const getContent = async (req, res) => {
    try {
        const result = await executeQuery(
            'SELECT id, title, content_type, category, duration_minutes, view_count, like_count FROM content_library WHERE is_published = TRUE ORDER BY view_count DESC'
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطا در بارگذاری محتواها' });
    }
};

// گرفتن یک محتوا خاص
const getContentById = async (req, res) => {
    try {
        const result = await executeQuery(
            'SELECT * FROM content_library WHERE id = $1 AND is_published = TRUE',
            [req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'محتوا یافت نشد' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطا در بارگذاری محتوا' });
    }
};

// لایک کردن محتوا
const toggleContentLike = async (req, res) => {
    try {
        await executeQuery(
            'UPDATE content_library SET like_count = like_count + 1 WHERE id = $1',
            [req.params.id]
        );
        res.json({ success: true, message: 'محتوا لایک شد' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطا در لایک کردن' });
    }
};

// تکمیل محتوا
const markContentCompleted = async (req, res) => {
    try {
        await executeQuery(
            'INSERT INTO user_progress (user_id, activity_type, related_content_id, points_earned) VALUES ($1, $2, $3, $4)',
            [req.user.userId, 'content_completed', req.params.id, 10]
        );
        res.json({ success: true, message: 'محتوا تکمیل شد' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطا در تکمیل محتوا' });
    }
};

// گرفتن دسته‌بندی‌ها
const getContentCategories = async (req, res) => {
    try {
        const result = await executeQuery(
            'SELECT category, COUNT(*) as count FROM content_library WHERE is_published = TRUE GROUP BY category'
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطا در بارگذاری دسته‌بندی‌ها' });
    }
};

module.exports = {
    getContent,
    getContentById,
    toggleContentLike,
    markContentCompleted,
    getContentCategories
};