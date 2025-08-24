const { executeQuery } = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const nodemailer = require('nodemailer');

// تنظیمات ایمیل (اطمینان پیدا کن EMAIL_USER و EMAIL_PASS در .env ست شده‌اند)
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

        if (!email || !password || !fullName) {
            return res.status(400).json({ success: false, message: 'email, password و fullName الزامی هستند' });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        // ساختن پرس‌وجو و پارامترها به‌صورت داینامیک تا اگر phone وجود نداشت وارد نشود
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

        // ارسال ایمیل تأیید (استفاده از BASE_URL یا localhost به عنوان fallback)
        const verificationToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1d' });
        const baseUrl = process.env.BASE_URL || process.env.FRONTEND_URL || 'http://localhost:5000';
        const verificationLink = `${baseUrl}/api/auth/verify-email/${verificationToken}`;

        // اگر EMAIL_USER / EMAIL_PASS ست نشده باشند، sendMail باعث خطا می‌شود؛ می‌توانیم خطا را لاگ کرده ولی ثبت را موفق در نظر بگیریم یا خطا را برگردانیم.
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'تأیید ایمیل',
                text: `لطفاً ایمیل خود را با کلیک روی این لینک تأیید کنید: ${verificationLink}`
            });
        } else {
            console.warn('ایمیل کاربر ارسال نشد چون EMAIL_USER یا EMAIL_PASS تنظیم نشده‌اند.');
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

// ورود کاربر
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

// خروج کاربر
const logout = (req, res) => {
    res.json({ success: true, message: 'خروج با موفقیت انجام شد' });
};

module.exports = {
    register,
    login,
    logout
    // اگر تو فایل‌های دیگه از توابعی مثل verifyEmail و ... استفاده می‌کنی، اضافه‌شون کن
};