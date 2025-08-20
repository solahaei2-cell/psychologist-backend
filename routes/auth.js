const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { validateRegister, validateLogin, checkUserExists } = require('../middleware/validation');
const {
    register,
    login,
    logout,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
    getUserProfile,
    updateUserProfile
} = require('../controllers/authController');

// Register a new user
router.post('/register', checkUserExists, validateRegister, register);

// Login user
router.post('/login', validateLogin, login);

// Logout user
router.post('/logout', authenticateToken, logout);

// Verify email
router.get('/verify-email/:token', verifyEmail);

// Resend verification email
router.post('/resend-verification', resendVerification);

// Forgot password
router.post('/forgot-password', forgotPassword);

// Reset password
router.post('/reset-password/:token', resetPassword);

// Get user profile
router.get('/profile', authenticateToken, getUserProfile);

// Update user profile
router.put('/profile', authenticateToken, updateUserProfile);

module.exports = router;