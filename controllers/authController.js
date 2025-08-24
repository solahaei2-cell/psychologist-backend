const { executeQuery } = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
require('dotenv').config();

// تنظیم transporter برای ارسال ایمیل
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// ثبت‌نام
const register = async (req, res) => {
    try {
        const { email, password, fullName, phone } = req.body;

        // اعتبارسنجی توی validateRegister انجام شده، اینجا فقط داده‌ها رو می‌گیریم
        const passwordHash = await bcrypt.hash(password, 12);

        const columns = ['email', 'password_hash', 'full_name', 'verification_token'];
        const values = [email, passwordHash, fullName];
        const placeholders = ['$1', '$2', '$3'];

        // تولید توکن تأیید
        const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1d' });
        values.push(verificationToken);
        placeholders.push('$4');

        if (phone !== undefined && phone !== null && phone !== '') {
            columns.push('phone');
            values.push(phone);
            placeholders.push(`$${values.length}`);
        }

        const query = `INSERT INTO users (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING id, email`;
        const result = await executeQuery(query, values);
        const userId = result.rows[0].id;

        const baseUrl = process.env.BASE_URL || 'https://psychologist-ai-fhcp.onrender.com';
        const verificationLink = `${baseUrl}/api/auth/verify-email/${verificationToken}`;

        console.log('Verification token:', verificationToken);
        console.log('Verification link (for testing):', verificationLink);

        // ارسال ایمیل (اگه تنظیمات موجود باشه)
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'تأیید ایمیل',
                text: `لطفاً ایمیل خود را با کلیک روی این لینک تأیید کنید: ${verificationLink}`,
                html: `<p>لطفاً ایمیل خود را با کلیک روی این لینک تأیید کنید: <a href="${verificationLink}">${verificationLink}</a></p>`
            });
        }

        res.json({ success: true, message: 'کاربر با موفقیت ثبت شد. لطفاً ایمیل خود را تأیید کنید.' });
    } catch (error) {
        console.error('❌ Error in register:', error.message, error.stack);
        res.status(500).json({ success: false, message: 'خطا در ثبت‌نام' });
    }
};

// تأیید ایمیل
const verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;

        // بررسی توکن
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const email = decoded.email;

        // آپدیت کاربر با استفاده از verification_token
        const updateResult = await executeQuery(
            'UPDATE users SET is_verified = TRUE, is_active = TRUE, verification_token = NULL WHERE verification_token = $1 RETURNING id, email, is_verified',
            [token]
        );

        if (updateResult.rows.length === 0) {
            console.log('Token not found:', token);
            return res.status(404).json({ success: false, message: 'توکن نامعتبر است یا قبلاً استفاده شده' });
        }

        res.json({ success: true, message: 'ایمیل با موفقیت تأیید شد' });
    } catch (error) {
        console.error('❌ verifyEmail Error:', error.message, error.stack);
        res.status(500).json({ success: false, message: 'خطا در تأیید ایمیل' });
    }
};

// ورود
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const result = await executeQuery('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(400).json({ success: false, message: 'کاربر یافت نشد' });
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'رمز عبور اشتباه است' });
        }

        if (!user.is_verified) {
            return res.status(400).json({ success: false, message: 'ایمیل شما تأیید نشده است' });
        }

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        await executeQuery('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);
        res.json({ success: true, token });
    } catch (error) {
        console.error('❌ Login Error:', error.message, error.stack);
        res.status(400).json({ success: false, message: 'خطا در ورود' });
    }
};

// خروج
const logout = (req, res) => {
    res.json({ success: true, message: 'خروج با موفقیت انجام شد' });
};

module.exports = {
    register,
    verifyEmail,
    login,
    logout
};