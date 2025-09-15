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

// گرفتن انواع ارزیابی‌های موجود
router.get('/types', async (req, res) => {
    try {
        const assessmentTypes = [
            { id: 'depression', name: 'ارزیابی افسردگی', description: 'تست Beck برای سنجش میزان افسردگی' },
            { id: 'anxiety', name: 'ارزیابی اضطراب', description: 'تست GAD-7 برای سنجش اضطراب عمومی' },
            { id: 'stress', name: 'ارزیابی استرس', description: 'تست سنجش میزان استرس روزانه' },
            { id: 'personality', name: 'ارزیابی شخصیت', description: 'تست Big Five برای شناخت ویژگی‌های شخصیتی' }
        ];
        res.json({ success: true, data: assessmentTypes });
    } catch (err) {
        res.status(500).json({ success: false, message: 'خطا در دریافت انواع ارزیابی' });
    }
});

// شروع ارزیابی جدید
router.post('/start', authenticateToken, async (req, res) => {
    try {
        const { assessment_type } = req.body;
        const result = await executeQuery(
            'INSERT INTO assessments (user_id, assessment_type, created_at) VALUES ($1, $2, NOW()) RETURNING id',
            [req.user.id, assessment_type]
        );
        res.json({ success: true, data: { assessment_id: result.rows[0].id } });
    } catch (err) {
        console.error('Error starting assessment:', err);
        res.status(500).json({ success: false, message: 'خطا در شروع ارزیابی' });
    }
});

// ثبت پاسخ‌های ارزیابی
router.post('/:assessmentId/answers', authenticateToken, async (req, res) => {
    try {
        const { answers, total_score, result } = req.body;
        
        // به‌روزرسانی ارزیابی با نتیجه نهایی
        await executeQuery(
            'UPDATE assessments SET total_score=$1, result=$2, completed_at=NOW() WHERE id=$3 AND user_id=$4',
            [total_score, result, req.params.assessmentId, req.user.id]
        );
        
        // ذخیره پاسخ‌های جزئی (اختیاری)
        if (answers && Array.isArray(answers)) {
            for (const answer of answers) {
                await executeQuery(
                    'INSERT INTO assessment_answers (assessment_id, question_id, answer_value) VALUES ($1, $2, $3)',
                    [req.params.assessmentId, answer.question_id, answer.answer_value]
                );
            }
        }
        
        res.json({ success: true, message: 'ارزیابی با موفقیت تکمیل شد' });
    } catch (err) {
        console.error('Error saving assessment answers:', err);
        res.status(500).json({ success: false, message: 'خطا در ذخیره پاسخ‌ها' });
    }
});

// گرفتن جزئیات یک ارزیابی
router.get('/:assessmentId', authenticateToken, async (req, res) => {
    try {
        const result = await executeQuery(
            'SELECT * FROM assessments WHERE id=$1 AND user_id=$2',
            [req.params.assessmentId, req.user.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'ارزیابی یافت نشد' });
        }
        
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error('Error fetching assessment:', err);
        res.status(500).json({ success: false, message: 'خطا در دریافت ارزیابی' });
    }
});

module.exports = router;
