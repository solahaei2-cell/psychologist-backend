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

module.exports = router;