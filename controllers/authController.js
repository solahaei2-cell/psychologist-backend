const { executeQuery } = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const nodemailer = require('nodemailer');

// تنظیمات ایمیل
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// ثبت‌نام کاربر
const register = async (req, res) => {
    try {
        const { email, password, fullName, phone } = req.body;
        const passwordHash = await bcrypt.hash(password, 12);

        // اجرای کوئری با PostgreSQL
        const result = await executeQuery(
            'INSERT INTO users (email, password_hash, full_name, phone) VALUES ($1, $2, $3, $4) RETURNING id',
            [email, passwordHash, fullName, phone]
        );

        const userId = result.rows[0].id;

        // ارسال ایمیل تأیید
        const verificationToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1d' });
        const verificationLink = `http://localhost:5000/api/auth/verify-email/${verificationToken}`;

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'تأیید ایمیل',
            text: `لطفاً ایمیل خود را با کلیک روی این لینک تأیید کنید: ${verificationLink}`
        });

        res.status(201).json({
            success: true,
            message: 'کاربر با موفقیت ثبت شد. لطفاً ایمیل خود را تأیید کنید.'
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// ورود کاربر
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
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
        res.status(400).json({ success: false, message: error.message });
    }
};

// خروج کاربر
const logout = (req, res) => {
    res.json({ success: true, message: 'خروج با موفقیت انجام شد' });
};

// تأیید ایمیل
const verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        await executeQuery('UPDATE users SET is_verified = TRUE WHERE id = $1', [decoded.userId]);
        res.json({ success: true, message: 'ایمیل با موفقیت تأیید شد' });
    } catch (error) {
        res.status(400).json({ success: false, message: 'توکن نامعتبر یا منقضی شده است' });
    }
};

// ارسال دوباره ایمیل تأیید
const resendVerification = async (req, res) => {
    try {
        const { email } = req.body;
        const result = await executeQuery('SELECT id FROM users WHERE email = $1', [email]);

        if (!result.rows || result.rows.length === 0) {
            return res.status(400).json({ success: false, message: 'کاربر یافت نشد' });
        }

        const userId = result.rows[0].id;
        const verificationToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1d' });
        const verificationLink = `http://localhost:5000/api/auth/verify-email/${verificationToken}`;

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'ارسال دوباره ایمیل تأیید',
            text: `لطفاً ایمیل خود را با کلیک روی این لینک تأیید کنید: ${verificationLink}`
        });

        res.json({ success: true, message: 'ایمیل تأیید دوباره ارسال شد' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// فراموشی رمز عبور
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const result = await executeQuery('SELECT id FROM users WHERE email = $1', [email]);

        if (!result.rows || result.rows.length === 0) {
            return res.status(400).json({ success: false, message: 'کاربر یافت نشد' });
        }

        const userId = result.rows[0].id;
        const resetToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
        const resetLink = `http://localhost:5000/api/auth/reset-password/${resetToken}`;

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'بازنشانی رمز عبور',
            text: `برای بازنشانی رمز عبور خود روی این لینک کلیک کنید: ${resetLink}`
        });

        res.json({ success: true, message: 'لینک بازنشانی ارسال شد' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// بازنشانی رمز عبور
const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { newPassword } = req.body;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const passwordHash = await bcrypt.hash(newPassword, 12);
        await executeQuery('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, decoded.userId]);
        res.json({ success: true, message: 'رمز عبور با موفقیت تغییر کرد' });
    } catch (error) {
        res.status(400).json({ success: false, message: 'توکن نامعتبر یا منقضی شده است' });
    }
};

// گرفتن پروفایل کاربر
const getUserProfile = async (req, res) => {
    try {
        const result = await executeQuery(
            'SELECT id, email, full_name, phone, is_verified FROM users WHERE id = $1',
            [req.user.userId]
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// به‌روزرسانی پروفایل کاربر
const updateUserProfile = async (req, res) => {
    try {
        const { fullName, phone } = req.body;
        await executeQuery(
            'UPDATE users SET full_name = $1, phone = $2 WHERE id = $3',
            [fullName, phone, req.user.userId]
        );
        res.json({ success: true, message: 'پروفایل با موفقیت به‌روزرسانی شد' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

module.exports = {
    register,
    login,
    logout,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
    getUserProfile,
    updateUserProfile
};
