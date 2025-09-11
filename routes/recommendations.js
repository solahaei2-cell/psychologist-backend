const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { executeQuery } = require('../config/database');

// گرفتن همه توصیه‌ها
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await executeQuery('SELECT id, title, description, user_id FROM recommendations');
        res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        res.status(500).json({ success: false, message: 'مشکلی در دریافت توصیه‌ها رخ داده' });
    }
});

// گرفتن توصیه‌ها برای یک کاربر
router.get('/user/:userId', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await executeQuery('SELECT id, title, description FROM recommendations WHERE user_id=$1', [userId]);
        res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching user recommendations:', error);
        res.status(500).json({ success: false, message: 'مشکلی در دریافت توصیه‌های کاربر رخ داده' });
    }
});

// اضافه کردن توصیه جدید
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { title, description, user_id } = req.body;
        await executeQuery(
            'INSERT INTO recommendations (title, description, user_id) VALUES ($1, $2, $3)',
            [title, description, user_id]
        );
        res.status(201).json({ success: true, message: 'توصیه با موفقیت اضافه شد' });
    } catch (error) {
        console.error('Error adding recommendation:', error);
        res.status(500).json({ success: false, message: 'مشکلی در اضافه کردن توصیه رخ داده' });
    }
});

// به‌روزرسانی توصیه
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description } = req.body;
        await executeQuery(
            'UPDATE recommendations SET title=$1, description=$2 WHERE id=$3',
            [title, description, id]
        );
        res.status(200).json({ success: true, message: 'توصیه با موفقیت به‌روزرسانی شد' });
    } catch (error) {
        console.error('Error updating recommendation:', error);
        res.status(500).json({ success: false, message: 'مشکلی در به‌روزرسانی توصیه رخ داده' });
    }
});

// حذف توصیه
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        await executeQuery('DELETE FROM recommendations WHERE id=$1', [id]);
        res.status(200).json({ success: true, message: 'توصیه با موفقیت حذف شد' });
    } catch (error) {
        console.error('Error deleting recommendation:', error);
        res.status(500).json({ success: false, message: 'مشکلی در حذف توصیه رخ داده' });
    }
});

module.exports = router;
