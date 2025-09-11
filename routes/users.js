const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { executeQuery } = require('../config/database');

// گرفتن همه کاربران
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await executeQuery('SELECT id, full_name, email, gender, phone FROM users');
        res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ success: false, message: 'مشکلی در دریافت کاربران رخ داده' });
    }
});

// گرفتن یک کاربر بر اساس id
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await executeQuery('SELECT id, full_name, email, gender, phone FROM users WHERE id=$1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'کاربر یافت نشد' });
        }
        res.status(200).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ success: false, message: 'مشکلی در دریافت کاربر رخ داده' });
    }
});

// اضافه کردن کاربر جدید
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { full_name, email, gender, phone } = req.body;
        await executeQuery(
            'INSERT INTO users (full_name, email, gender, phone) VALUES ($1, $2, $3, $4)',
            [full_name, email, gender, phone]
        );
        res.status(201).json({ success: true, message: 'کاربر با موفقیت اضافه شد' });
    } catch (error) {
        console.error('Error adding user:', error);
        res.status(500).json({ success: false, message: 'مشکلی در اضافه کردن کاربر رخ داده' });
    }
});

// به‌روزرسانی کاربر
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { full_name, email, gender, phone } = req.body;
        await executeQuery(
            'UPDATE users SET full_name=$1, email=$2, gender=$3, phone=$4 WHERE id=$5',
            [full_name, email, gender, phone, id]
        );
        res.status(200).json({ success: true, message: 'کاربر با موفقیت به‌روزرسانی شد' });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ success: false, message: 'مشکلی در به‌روزرسانی کاربر رخ داده' });
    }
});

// حذف کاربر
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        await executeQuery('DELETE FROM users WHERE id=$1', [id]);
        res.status(200).json({ success: true, message: 'کاربر با موفقیت حذف شد' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ success: false, message: 'مشکلی در حذف کاربر رخ داده' });
    }
});

module.exports = router;
