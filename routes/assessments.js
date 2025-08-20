const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { validateAssessment } = require('../middleware/validation');
const { executeQuery } = require('../config/database');

// گرفتن همه ارزیابی‌های کاربر
router.get('/', authenticateToken, async (req, res) => {
    try {
        const assessments = await executeQuery(
            'SELECT id, user_id, assessment_type, total_score, result_category, completed_at FROM assessments WHERE user_id = ? ORDER BY completed_at DESC',
            [req.user.userId]
        );
        res.json({ success: true, data: assessments });
    } catch (error) {
        console.error('❌ GET /assessments error:', error.message);
        res.status(500).json({ success: false, message: 'خطا در بارگذاری ارزیابی‌ها' });
    }
});

// گرفتن یک ارزیابی خاص
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const assessments = await executeQuery(
            'SELECT * FROM assessments WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.userId]
        );
        if (assessments.length === 0) {
            return res.status(404).json({ success: false, message: 'ارزیابی یافت نشد' });
        }
        res.json({ success: true, data: assessments[0] });
    } catch (error) {
        console.error('❌ GET /assessments/:id error:', error.message);
        res.status(500).json({ success: false, message: 'خطا در بارگذاری ارزیابی' });
    }
});

// ثبت یک ارزیابی جدید
router.post('/', authenticateToken, validateAssessment, async (req, res) => {
    try {
        const {
            assessment_type,
            questions,
            answers,
            total_score,
            max_possible_score,
            result_category,
            severity_level,
            recommendations
        } = req.body;

        const result = await executeQuery(
            'INSERT INTO assessments (user_id, assessment_type, questions, answers, total_score, max_possible_score, result_category, severity_level, recommendations) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                req.user.userId,
                assessment_type,
                JSON.stringify(questions),
                JSON.stringify(answers),
                total_score,
                max_possible_score,
                result_category,
                severity_level || 0,
                recommendations ? JSON.stringify(recommendations) : null
            ]
        );

        res.status(201).json({ success: true, id: result.insertId });
    } catch (error) {
        console.error('❌ POST /assessments error:', error.message);
        res.status(400).json({ success: false, message: error.message });
    }
});

// به‌روزرسانی یک ارزیابی
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            assessment_type,
            questions,
            answers,
            total_score,
            max_possible_score,
            result_category,
            severity_level,
            recommendations,
            follow_up_needed,
            professional_referral
        } = req.body;

        const existing = await executeQuery(
            'SELECT * FROM assessments WHERE id = ? AND user_id = ?',
            [id, req.user.userId]
        );

        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'ارزیابی یافت نشد' });
        }

        await executeQuery(
            'UPDATE assessments SET assessment_type = ?, questions = ?, answers = ?, total_score = ?, max_possible_score = ?, result_category = ?, severity_level = ?, recommendations = ?, follow_up_needed = ?, professional_referral = ? WHERE id = ?',
            [
                assessment_type || existing[0].assessment_type,
                questions ? JSON.stringify(questions) : existing[0].questions,
                answers ? JSON.stringify(answers) : existing[0].answers,
                total_score || existing[0].total_score,
                max_possible_score || existing[0].max_possible_score,
                result_category || existing[0].result_category,
                severity_level || existing[0].severity_level,
                recommendations ? JSON.stringify(recommendations) : existing[0].recommendations,
                follow_up_needed || existing[0].follow_up_needed,
                professional_referral || existing[0].professional_referral,
                id
            ]
        );

        res.json({ success: true, message: 'ارزیابی به‌روزرسانی شد' });
    } catch (error) {
        console.error('❌ PUT /assessments/:id error:', error.message);
        res.status(400).json({ success: false, message: 'خطا در به‌روزرسانی ارزیابی' });
    }
});

module.exports = router;
