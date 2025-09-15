const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { executeQuery } = require('../config/database');

// گرفتن چت‌های کاربر
router.get('/', authenticateToken, async (req, res) => {
    try {
        const chats = await executeQuery(
            'SELECT id, session_type, started_at FROM chat_sessions WHERE user_id = $1 ORDER BY started_at DESC',
            [req.user.id]
        );
        res.json({ success: true, data: chats.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطا در بارگذاری چت‌ها' });
    }
});

// ایجاد چت جدید
router.post('/new', authenticateToken, async (req, res) => {
    try {
        const { session_type } = req.body;
        const result = await executeQuery(
            'INSERT INTO chat_sessions (user_id, session_type, started_at) VALUES ($1, $2, NOW()) RETURNING id',
            [req.user.id, session_type || 'general']
        );
        res.json({ success: true, data: { chat_id: result.rows[0].id } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطا در ایجاد چت جدید' });
    }
});

// گرفتن پیام‌های یک چت
router.get('/:chatId/messages', authenticateToken, async (req, res) => {
    try {
        const messages = await executeQuery(
            'SELECT id, message_text, sender_type, sent_at FROM chat_messages WHERE chat_session_id = $1 ORDER BY sent_at ASC',
            [req.params.chatId]
        );
        res.json({ success: true, data: messages.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطا در بارگذاری پیام‌ها' });
    }
});

// ارسال پیام جدید
router.post('/:chatId/messages', authenticateToken, async (req, res) => {
    try {
        const { message_text } = req.body;
        await executeQuery(
            'INSERT INTO chat_messages (chat_session_id, message_text, sender_type, sent_at) VALUES ($1, $2, $3, NOW())',
            [req.params.chatId, message_text, 'user']
        );
        
        // اینجا می‌توانید پاسخ هوش مصنوعی را اضافه کنید
        const aiResponse = "این یک پاسخ نمونه است. در آینده با AI واقعی جایگزین خواهد شد.";
        await executeQuery(
            'INSERT INTO chat_messages (chat_session_id, message_text, sender_type, sent_at) VALUES ($1, $2, $3, NOW())',
            [req.params.chatId, aiResponse, 'ai']
        );
        
        res.json({ success: true, message: 'پیام ارسال شد' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطا در ارسال پیام' });
    }
});

// ارسال پیام ساده (برای چت عمومی)
router.post('/message', authenticateToken, async (req, res) => {
    try {
        const { message } = req.body;
        
        // پاسخ‌های نمونه ساده
        const responses = [
            "سلام! چطور می‌تونم کمکتون کنم؟",
            "این موضوع جالبی است. می‌تونید بیشتر توضیح بدید؟",
            "متوجه شدم. چه احساسی در این مورد دارید؟",
            "این تجربه برای شما چطور بوده؟",
            "ممنون که این موضوع رو با من در میان گذاشتید."
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        
        res.json({ 
            success: true, 
            data: {
                message: randomResponse,
                reply: randomResponse
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطا در پردازش پیام' });
    }
});

module.exports = router;