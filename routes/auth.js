// routes/auth.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { validateRegister, validateLogin, checkUserExists } = require('../middleware/validation');
const { register, verifyEmail, login, logout } = require('../controllers/authController');

// ثبت‌نام
router.post('/register', checkUserExists, validateRegister, register);

// endpoint تأیید ایمیل (GET زیرا لینک از ایمیل باز می‌شود)
router.get('/verify-email/:token', verifyEmail);

// ورود
router.post('/login', validateLogin, login);

// خروج
router.post('/logout', authenticateToken, logout);

// گرفتن اطلاعات کاربر لاگین شده
router.get('/me', authenticateToken, async (req, res) => {
    try {
        res.json({
            success: true,
            user: {
                id: req.user.id,
                email: req.user.email,
                full_name: req.user.fullName,
                is_verified: req.user.isVerified
            }
        });
    } catch (error) {
        console.error('Error fetching user info:', error);
        res.status(500).json({ success: false, message: 'خطا در دریافت اطلاعات کاربر' });
    }
});

module.exports = router;