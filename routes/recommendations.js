const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { executeQuery } = require('../config/database');

// گرفتن پیشنهادات شخصی‌سازی‌شده برای کاربر لاگین شده
router.get('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // پیشنهادات بر اساس آخرین ارزیابی‌های کاربر
        const result = await executeQuery(`
            SELECT 
                'assessment' as type,
                'depression' as id,
                'ارزیابی افسردگی' as title,
                'بررسی وضعیت روحی و احساسات شما' as description
            WHERE NOT EXISTS (
                SELECT 1 FROM assessments 
                WHERE user_id = $1 AND assessment_type = 'depression' 
                AND created_at > NOW() - INTERVAL '30 days'
            )
            UNION ALL
            SELECT 
                'assessment' as type,
                'anxiety' as id,
                'ارزیابی اضطراب' as title,
                'سنجش میزان اضطراب و نگرانی‌های شما' as description
            WHERE NOT EXISTS (
                SELECT 1 FROM assessments 
                WHERE user_id = $1 AND assessment_type = 'anxiety' 
                AND created_at > NOW() - INTERVAL '30 days'
            )
            UNION ALL
            SELECT 
                'content' as type,
                'stress-management' as id,
                'تکنیک‌های مدیریت استرس' as title,
                'یادگیری روش‌های کاهش استرس روزانه' as description
            UNION ALL
            SELECT 
                'content' as type,
                'mindfulness' as id,
                'تمرینات ذهن‌آگاهی' as title,
                'تمرینات مدیتیشن و آرامش ذهن' as description
            LIMIT 4
        `, [userId]);
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        res.status(500).json({ success: false, message: 'مشکلی در دریافت پیشنهادات رخ داده' });
    }
});

// گرفتن توصیه‌های کاربر لاگین شده
router.get('/my', authenticateToken, async (req, res) => {
    try {
        const result = await executeQuery(
            'SELECT id, title, description, created_at FROM recommendations WHERE user_id=$1 ORDER BY created_at DESC', 
            [req.user.id]
        );
        res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching user recommendations:', error);
        res.status(500).json({ success: false, message: 'مشکلی در دریافت توصیه‌های شما رخ داده' });
    }
});

// گرفتن توصیه‌ها برای یک کاربر (برای ادمین)
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
