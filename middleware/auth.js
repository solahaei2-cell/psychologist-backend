// middleware/auth.js
const jwt = require('jsonwebtoken');
const { executeQuery } = require('../config/database');
const { verifyToken } = require('../utils/jwt');

const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!authHeader) {
            console.warn('Auth middleware: Missing Authorization header for', req.method, req.originalUrl, 'origin:', req.headers.origin);
        } else {
            console.log('Auth middleware: Authorization header detected. Prefix:', String(authHeader).slice(0, 16) + '...');
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'توکن احراز هویت مورد نیاز است'
            });
        }

        const decoded = verifyToken(token);
        if (!decoded || !decoded.userId) {
            console.warn('Auth middleware: Decoded token invalid structure');
        }

        const result = await executeQuery(
            'SELECT id, email, full_name, is_active, is_verified FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'کاربر یافت نشد'
            });
        }

        const user = result.rows[0];

        const allowInactive = String(process.env.ALLOW_INACTIVE_LOGIN || '').toLowerCase() === 'true' || process.env.NODE_ENV !== 'production';
        if (user.is_active === false && !allowInactive) {
            console.warn('Auth middleware: user inactive -> 401', { userId: user.id, email: user.email });
            return res.status(401).json({
                success: false,
                message: 'حساب کاربری غیرفعال است'
            });
        } else if (user.is_active === false && allowInactive) {
            console.warn('⚠️ Auth middleware: allowing inactive user due to ALLOW_INACTIVE_LOGIN or non-production', { userId: user.id });
        }

        req.user = {
            id: user.id,
            userId: user.id,
            email: user.email,
            fullName: user.full_name,
            isVerified: user.is_verified
        };

        await executeQuery(
            'UPDATE users SET last_activity = NOW() WHERE id = $1',
            [decoded.userId]
        );

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'توکن نامعتبر است'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'توکن منقضی شده است'
            });
        }

        console.error('Auth middleware error:', error.message, error.stack);
        res.status(500).json({
            success: false,
            message: 'خطا در احراز هویت'
        });
    }
};

const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            const decoded = verifyToken(token);
            const result = await executeQuery(
                'SELECT id, email, full_name FROM users WHERE id = $1 AND is_active = TRUE',
                [decoded.userId]
            );

            if (result.rows.length > 0) {
                req.user = {
                    id: result.rows[0].id,
                    userId: result.rows[0].id,
                    email: result.rows[0].email,
                    fullName: result.rows[0].full_name
                };
            }
        }

        next();
    } catch (error) {
        console.error('OptionalAuth error:', error.message);
        next();
    }
};

module.exports = {
    authenticateToken,
    optionalAuth
};