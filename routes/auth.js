const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { validateRegister, validateLogin, checkUserExists } = require('../middleware/validation');
const {
    register,
    login,
    logout,
    // اگر تو فایل کنترلر توابع دیگری داری، ایمپورت‌شان کن
} = require('../controllers/authController');

// Register a new user
router.post('/register', checkUserExists, validateRegister, register);

// Login user
router.post('/login', validateLogin, login);

// Logout user
router.post('/logout', authenticateToken, logout);

// بقیه مسیرها اگر لازم بود اضافه کن...

module.exports = router;