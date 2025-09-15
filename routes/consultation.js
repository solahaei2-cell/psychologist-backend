const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { executeQuery } = require('../config/database');

// درخواست مشاوره جدید
router.post('/request', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { type, date, time, description } = req.body;

        // اعتبارسنجی ورودی
        if (!type || !date || !time || !description) {
            return res.status(400).json({ 
                success: false, 
                message: 'لطفاً همه فیلدها را پر کنید' 
            });
        }

        // ذخیره درخواست در دیتابیس
        await executeQuery(
            `INSERT INTO consultation_requests (user_id, type, date, time, description, status, created_at) 
             VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
            [userId, type, date, time, description, 'pending']
        );

        res.status(201).json({ 
            success: true, 
            message: 'درخواست مشاوره با موفقیت ثبت شد' 
        });
    } catch (error) {
        console.error('Error creating consultation request:', error);
        res.status(500).json({ 
            success: false, 
            message: 'خطا در ثبت درخواست مشاوره' 
        });
    }
});

// گرفتن درخواست‌های مشاوره کاربر
router.get('/my-requests', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await executeQuery(
            `SELECT id, type, date, time, description, status, created_at 
             FROM consultation_requests 
             WHERE user_id = $1 
             ORDER BY created_at DESC`,
            [userId]
        );

        res.json({ 
            success: true, 
            data: result.rows 
        });
    } catch (error) {
        console.error('Error fetching consultation requests:', error);
        res.status(500).json({ 
            success: false, 
            message: 'خطا در دریافت درخواست‌های مشاوره' 
        });
    }
});

// گرفتن همه درخواست‌های مشاوره (برای ادمین)
router.get('/all-requests', authenticateToken, async (req, res) => {
    try {
        const result = await executeQuery(
            `SELECT cr.id, cr.type, cr.date, cr.time, cr.description, cr.status, cr.created_at,
                    u.full_name, u.email
             FROM consultation_requests cr
             JOIN users u ON cr.user_id = u.id
             ORDER BY cr.created_at DESC`
        );

        res.json({ 
            success: true, 
            data: result.rows 
        });
    } catch (error) {
        console.error('Error fetching all consultation requests:', error);
        res.status(500).json({ 
            success: false, 
            message: 'خطا در دریافت درخواست‌های مشاوره' 
        });
    }
});

// به‌روزرسانی وضعیت درخواست مشاوره
router.put('/update-status/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['pending', 'approved', 'rejected', 'completed'].includes(status)) {
            return res.status(400).json({ 
                success: false, 
                message: 'وضعیت نامعتبر' 
            });
        }

        await executeQuery(
            'UPDATE consultation_requests SET status = $1 WHERE id = $2',
            [status, id]
        );

        res.json({ 
            success: true, 
            message: 'وضعیت درخواست به‌روزرسانی شد' 
        });
    } catch (error) {
        console.error('Error updating consultation status:', error);
        res.status(500).json({ 
            success: false, 
            message: 'خطا در به‌روزرسانی وضعیت' 
        });
    }
});

module.exports = router;
