const { executeQuery } = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const nodemailer = require('nodemailer');

// تنظیم transporter (اگر EMAIL_USER/EMAIL_PASS ندارید، ایمیل ارسال نخواهد شد)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Register
const register = async (req, res) => {
  try {
    const { email, password, fullName, phone } = req.body;
    if (!email || !password || !fullName) {
      return res.status(400).json({ success: false, message: 'email, password و fullName الزامی هستند' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const columns = ['email', 'password_hash', 'full_name'];
    const values = [email, passwordHash, fullName];
    const placeholders = ['$1', '$2', '$3'];

    if (phone !== undefined && phone !== null && phone !== '') {
      columns.push('phone');
      values.push(phone);
      placeholders.push(`$${values.length}`);
    }

    const query = `INSERT INTO users (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING id`;
    const result = await executeQuery(query, values);
    const userId = result.rows[0].id;

    // ایجاد توکن تأیید ایمیل
    const verificationToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1d' });
    const baseUrl = process.env.BASE_URL || process.env.FRONTEND_URL || 'https://psychologist-ai-fhcp.onrender.com';
    const verificationLink = `${baseUrl}/api/auth/verify-email/${verificationToken}`;

    // لاگ کردن توکن/لینک برای تست (مؤقتاً)
    console.log('Verification link (for testing):', verificationLink);

    // ارسال ایمیل در صورتی که تنظیمات ایمیل کامل باشد
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'تأیید ایمیل',
          text: `لطفاً ایمیل خود را با کلیک روی این لینک تأیید کنید: ${verificationLink}`
        });
      } catch (mailErr) {
        // لاگ خطای ارسال ایمیل اما ثبت‌نام موفقیت‌آمیز است
        console.error('Email send error:', mailErr.message);
      }
    } else {
      console.warn('EMAIL_USER یا EMAIL_PASS تنظیم نشده‌اند — ایمیل ارسال نشد.');
    }

    res.status(201).json({
      success: true,
      message: 'کاربر با موفقیت ثبت شد. لطفاً ایمیل خود را تأیید کنید.'
    });
  } catch (error) {
    console.error('Register Error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Verify email endpoint
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) {
      return res.status(400).json({ success: false, message: 'توکن تأیید ارسال نشده است' });
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ success: false, message: 'توکن نامعتبر یا منقضی شده است' });
    }

    const userId = payload.userId;
    // به‌روزرسانی کاربر: is_verified = true و (اختیاری) is_active = true
    const updateResult = await executeQuery(
      'UPDATE users SET is_verified = TRUE, is_active = TRUE WHERE id = $1 RETURNING id, email, is_verified',
      [userId]
    );

    if (!updateResult.rows || updateResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'کاربری با این توکن یافت نشد' });
    }

    res.json({ success: true, message: 'ایمیل با موفقیت تأیید شد' });
  } catch (error) {
    console.error('verifyEmail Error:', error);
    res.status(500).json({ success: false, message: 'خطا در تأیید ایمیل' });
  }
};

// Login (بدون تغییر)
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'email و password الزامی‌اند' });
    }

    const result = await executeQuery('SELECT * FROM users WHERE email = $1', [email]);
    if (!result.rows || result.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'کاربر یافت نشد' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'رمز عبور اشتباه است' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    await executeQuery('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);
    res.json({ success: true, token });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

const logout = (req, res) => {
  res.json({ success: true, message: 'خروج با موفقیت انجام شد' });
};

module.exports = {
  register,
  verifyEmail,
  login,
  logout
};