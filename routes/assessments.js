const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { validateAssessment } = require('../middleware/validation');
const { executeQuery } = require('../config/database');

// 📌 گرفتن همه ارزیابی‌های کاربر (تاریخچه)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const assessments = await executeQuery(
      `SELECT id, assessment_type, total_score, result_category, completed_at
       FROM assessments
       WHERE user_id = $1
       ORDER BY completed_at DESC`,
      [req.user.userId]
    );

    res.json({ success: true, data: assessments.rows });
  } catch (error) {
    console.error('❌ GET /assessments error:', error.message);
    res.status(500).json({ success: false, message: 'خطا در بارگذاری ارزیابی‌ها' });
  }
});

// 📌 گرفتن یک ارزیابی خاص
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const assessments = await executeQuery(
      'SELECT * FROM assessments WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.userId]
    );

    if (assessments.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ارزیابی یافت نشد' });
    }

    res.json({ success: true, data: assessments.rows[0] });
  } catch (error) {
    console.error('❌ GET /assessments/:id error:', error.message);
    res.status(500).json({ success: false, message: 'خطا در بارگذاری ارزیابی' });
  }
});

// 📌 ثبت یک ارزیابی جدید
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

    // ثبت ارزیابی جدید
    const result = await executeQuery(
      `INSERT INTO assessments (
          user_id, assessment_type, questions, answers,
          total_score, max_possible_score, result_category,
          severity_level, recommendations, completed_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW()) RETURNING id`,
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

    // ✅ آپدیت امتیاز کل کاربر
    await executeQuery(
      'UPDATE users SET total_points = total_points + $1 WHERE id = $2',
      [total_score, req.user.userId]
    );

    res.status(201).json({ success: true, id: result.rows[0].id });
  } catch (error) {
    console.error('❌ POST /assessments error:', error.message);
    res.status(400).json({ success: false, message: error.message });
  }
});

// 📌 به‌روزرسانی یک ارزیابی
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
      'SELECT * FROM assessments WHERE id = $1 AND user_id = $2',
      [id, req.user.userId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ارزیابی یافت نشد' });
    }

    await executeQuery(
      `UPDATE assessments SET 
          assessment_type = $1,
          questions = $2,
          answers = $3,
          total_score = $4,
          max_possible_score = $5,
          result_category = $6,
          severity_level = $7,
          recommendations = $8,
          follow_up_needed = $9,
          professional_referral = $10
       WHERE id = $11`,
      [
        assessment_type || existing.rows[0].assessment_type,
        questions ? JSON.stringify(questions) : existing.rows[0].questions,
        answers ? JSON.stringify(answers) : existing.rows[0].answers,
        total_score || existing.rows[0].total_score,
        max_possible_score || existing.rows[0].max_possible_score,
        result_category || existing.rows[0].result_category,
        severity_level || existing.rows[0].severity_level,
        recommendations ? JSON.stringify(recommendations) : existing.rows[0].recommendations,
        follow_up_needed || existing.rows[0].follow_up_needed,
        professional_referral || existing.rows[0].professional_referral,
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
