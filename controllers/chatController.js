const { executeQuery } = require('../config/database');

// گرفتن چت‌های کاربر
const getChatSessions = async (req, res) => {
    try {
        const result = await executeQuery(
            'SELECT id, session_type, started_at FROM chat_sessions WHERE user_id = $1 ORDER BY started_at DESC',
            [req.user.userId]
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطا در بارگذاری چت‌ها' });
    }
};

module.exports = {
    getChatSessions
};