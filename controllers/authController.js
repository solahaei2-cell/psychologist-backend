const { executeQuery } = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
require('dotenv').config();
const { signToken, verifyToken } = require('../utils/jwt');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// ========================= REGISTER =========================
const register = async (req, res) => {
    try {
        console.log('📥 Register Request Body:', req.body);

        // یکسان‌سازی ورودی‌ها (چه name باشه چه fullName و چه phone یا mobile)
        const body = req.body || {};
        const fullName = body.fullName || body.name || null;
        const email = body.email || null;
        const mobile = body.mobile || body.phone || null;
        const password = body.password || null;
        const gender = body.gender || null;
        const acceptTerms = body.acceptTerms === true || body.acceptTerms === 'true';

        console.log('✅ Normalized values:', { fullName, email, mobile, gender, acceptTerms, passwordLen: password?.length });

        // اعتبارسنجی ساده
        if (!fullName || !email || !password || !acceptTerms) {
            return res.status(400).json({ success: false, message: 'نام کامل، ایمیل، رمز عبور و قبول قوانین الزامی است.' });
        }

        if (password.length < 8) {
            return res.status(400).json({ success: false, message: 'رمز عبور باید حداقل ۸ کاراکتر باشد.' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: 'ایمیل نامعتبر است.' });
        }

        // بررسی وجود کاربر
        const checkUserQuery = 'SELECT id FROM users WHERE email = $1';
        const checkUserResult = await executeQuery(checkUserQuery, [email]);
        console.log('🔎 Check existing user:', checkUserResult.rows);

        if (checkUserResult.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'ایمیل قبلاً ثبت شده است.' });
        }

        // هش کردن رمز
        const passwordHash = await bcrypt.hash(password, 12);
        const verificationToken = signToken({ email }, { expiresIn: '1d' });

        const columns = ['email', 'password_hash', 'full_name', 'mobile', 'gender', 'verification_token'];
        const values = [email, passwordHash, fullName, mobile, gender, verificationToken];
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

        const query = `INSERT INTO users (${columns.join(', ')}) VALUES (${placeholders}) RETURNING id, email`;
        console.log('📤 Insert query:', query, values);

        const result = await executeQuery(query, values);
        console.log('✅ Insert result:', result.rows);

        // لینک تأیید
        const baseUrl = process.env.BASE_URL || 'https://psychologist-ai-fhcp.onrender.com';
        const verificationLink = `${baseUrl}/api/auth/verify-email/${verificationToken}`;
        console.log('🔗 Verification link:', verificationLink);

        // ایمیل (اختیاری – خطا نده اگر ارسال نشد)
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            try {
                await transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: email,
                    subject: 'تأیید ایمیل',
                    html: `<p>برای تأیید ایمیل کلیک کنید: <a href="${verificationLink}">${verificationLink}</a></p>`
                });
            } catch (mailErr) {
                console.error('⚠️ Email send failed:', mailErr.message);
            }
        }

        res.status(201).json({ success: true, message: 'ثبت‌نام با موفقیت انجام شد. لطفاً ایمیل خود را تأیید کنید.' });
    } catch (error) {
        console.error('❌ Full Error in register:', error);
        res.status(500).json({ success: false, message: 'خطای سرور در ثبت‌نام.' });
    }
};

// ========================= VERIFY EMAIL =========================
const verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;
        const decoded = verifyToken(token);
        const email = decoded.email;

        const result = await executeQuery(
            'UPDATE users SET is_verified = true WHERE email = $1 AND verification_token = $2',
            [email, token]
        );

        if (result.rowCount === 0) {
            console.log('Token not found or already used:', token);
            return res.status(404).json({ success: false, message: 'توکن نامعتبر یا منقضی شده است.' });
        }

        res.json({ success: true, message: 'ایمیل با موفقیت تأیید شد.' });
    } catch (error) {
        console.error('❌ verifyEmail Error:', error);
        res.status(500).json({ success: false, message: 'خطا در تأیید ایمیل.' });
    }
};

// ========================= LOGIN =========================
const login = async (req, res) => {
    try {
        console.log('📥 Login Request Body:', req.body);

        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'ایمیل و رمز عبور الزامی است.' });
        }

        const result = await executeQuery('SELECT * FROM users WHERE email = $1', [email]);
        console.log('🔎 Login user result:', result.rows);

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

        const token = signToken({ userId: user.id }, { expiresIn: '7d' });
        await executeQuery('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

        res.json({ success: true, token });
    } catch (error) {
        console.error('❌ Login Error:', error);
        res.status(500).json({ success: false, message: 'خطای سرور در ورود.' });
    }
};

// ========================= LOGOUT =========================
const logout = (req, res) => {
    res.json({ success: true, message: 'خروج انجام شد.' });
};

module.exports = {
    register,
    verifyEmail,
    login,
    logout
};
