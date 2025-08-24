const { executeQuery } = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const nodemailer = require('nodemailer');

// تنظیم transporter (اگر EMAIL_USER/EMAIL_PASS داری، ایمیل ارسال می‌شه)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// تابع اعتبارسنجی رمز
function validatePassword(password) {
    const minLength = 8;
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    console.log(`Password: ${password}, Length: ${password.length}, HasLetter: ${hasLetter}, HasNumber: ${hasNumber}`);
    return password.length >= minLength && hasLetter && hasNumber;
}

// ثبت‌نام
const register = async (req, res) => {
    try {
        const { email, password, fullName, phone } = req.body;
        if (!email || !password || !fullName) {
            return res.status(400).json({ success: false, message: 'email, password و fullName الزامی هستند' });
        }

        if (!validatePassword(password)) {
            return res.status(400).json({ success: false, message: 'رمز عبور باید حداقل 8 کاراکتر و شامل حرف و عدد باشد' });
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

        const verificationToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1d' });
        const baseUrl = process.env.BASE_URL || 'https://psychologist-ai-fhcp.onrender.com';
        const verificationLink = `${baseUrl}/api/auth/verify-email/${verificationToken}`;

        console.log('Verification link (for testing):', verificationLink);

        // ارسال ایمیل (اگه تنظیمات داری)
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
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

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

// ورود
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