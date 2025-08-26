const { executeQuery } = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
require('dotenv').config();

// تنظیم ایمیل
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
        console.log('Register Request Body:', req.body); // لاگ ورودی

        const { email, password, fullName, phone } = req.body;

        // بررسی فیلدهای ضروری
        if (!email || !password || !fullName) {
            return res.status(400).json({ success: false, message: 'فیلدهای ضروری ناقص هستند.' });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        // تولید توکن تأیید
        const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1d' });

        let columns = ['email', 'password_hash', 'full_name', 'verification_token'];
        let values = [email, passwordHash, fullName, verificationToken];
        let placeholders = ['$1', '$2', '$3', '$4'];

        if (phone) {
            columns.push('phone');
            values.push(phone);
            placeholders.push(`$${values.length}`);
        }

        const query = `INSERT INTO users (${columns.join(', ')}) 
                       VALUES (${placeholders.join(', ')}) 
                       RETURNING id, email`;
        const result = await executeQuery(query, values);

        const baseUrl = process.env.BASE_URL || 'https://psychologist-ai-fhcp.onrender.com';
        const verificationLink = `${baseUrl}/api/auth/verify-email/${verificationToken}`;

        console.log('Verification link:', verificationLink);

        // ارسال ایمیل فقط در صورت تنظیمات کامل
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'تأیید ایمیل',
                html: `<p>برای تأیید ایمیل کلیک کنید: <a href="${verificationLink}">${verificationLink}</a></p>`
            });
        }

        res.status(201).json({
            success: true,
            message: 'کاربر ثبت شد. لطفاً ایمیل را تأیید کنید.'
        });

    } catch (error) {
        console.error('❌ Error in register:', error);
        res.status(500).json({ success: false, message: 'خطای سرور در ثبت‌نام.' });
    }
};

// تأیید ایمیل
const verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const updateResult = await executeQuery(
            'UPDATE users SET is_verified = TRUE, is_active = TRUE, verification_token = NULL WHERE verification_token = $1 RETURNING id, email, is_verified',
            [token]
        );

        if (updateResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'توکن نامعتبر یا منقضی شده است.' });
        }

        res.json({ success: true, message: 'ایمیل با موفقیت تأیید شد.' });

    } catch (error) {
        console.error('❌ verifyEmail Error:', error);
        res.status(500).json({ success: false, message: 'خطا در تأیید ایمیل.' });
    }
};

// ورود
const login = async (req, res) => {
    try {
        console.log('Login Request Body:', req.body);

        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'ایمیل و رمز عبور الزامی است.' });
        }

        const result = await executeQuery('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(400).json({ success: false, message: 'کاربر یافت نشد.' });
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'رمز عبور اشتباه است.' });
        }

        if (!user.is_verified) {
            return res.status(400).json({ success: false, message: 'ایمیل شما تأیید نشده است.' });
        }

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        await executeQuery('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

        res.json({ success: true, token });
    } catch (error) {
        console.error('❌ Login Error:', error);
        res.status(500).json({ success: false, message: 'خطای سرور در ورود.' });
    }
};

// خروج
const logout = (req, res) => {
    res.json({ success: true, message: 'خروج انجام شد.' });
};

module.exports = {
    register,
    verifyEmail,
    login,
    logout
};
