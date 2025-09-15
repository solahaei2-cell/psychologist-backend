const { executeQuery } = require('../config/database');

// ثبت ارزیابی
const saveAssessment = async (req, res) => {
    try {
        const { assessment_type, questions, answers, total_score, max_possible_score, result_category, severity_level, recommendations } = req.body;
        const { rows } = await executeQuery(
            'INSERT INTO assessments (user_id, assessment_type, questions, answers, total_score, max_possible_score, result_category, severity_level, recommendations) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
            [
                req.user.id,
                assessment_type,
                JSON.stringify(questions),
                JSON.stringify(answers),
                total_score,
                max_possible_score,
                result_category,
                severity_level,
                JSON.stringify(recommendations)
            ]
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطا در ذخیره ارزیابی' });
    }
};

// گرفتن ارزیابی‌های کاربر
const getUserAssessments = async (req, res) => {
    try {
        const { rows } = await executeQuery(
            'SELECT id, assessment_type, total_score, result_category, completed_at FROM assessments WHERE user_id = $1 ORDER BY completed_at DESC',
            [req.user.id]
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطا در بارگذاری ارزیابی‌ها' });
    }
};

// گرفتن آمار ارزیابی‌ها
const getAssessmentAnalytics = async (req, res) => {
    try {
        const { rows } = await executeQuery(
            'SELECT assessment_type, AVG(total_score) as avg_score, COUNT(*) as count FROM assessments WHERE user_id = $1 GROUP BY assessment_type',
            [req.user.id]
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطا در بارگذاری آمار' });
    }
};

module.exports = {
    saveAssessment,
    getUserAssessments,
    getAssessmentAnalytics
};