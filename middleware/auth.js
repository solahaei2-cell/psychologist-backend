const jwt = require('jsonwebtoken');
const { executeQuery } = require('../config/database');

const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'توکن احراز هویت مورد نیاز است'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await executeQuery(
            'SELECT id, email, full_name, is_active, is_verified FROM users WHERE id = ?',
            [decoded.userId]
        );

        if (user.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'کاربر یافت نشد'
            });
        }

        if (!user[0].is_active) {
            return res.status(401).json({
                success: false,
                message: 'حساب کاربری غیرفعال است'
            });
        }

        req.user = {
            userId: user[0].id,
            email: user[0].email,
            fullName: user[0].full_name,
            isVerified: user[0].is_verified
        };

        await executeQuery(
            'UPDATE users SET last_activity = NOW() WHERE id = ?',
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

        console.error('Auth middleware error:', error);
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
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await executeQuery(
                'SELECT id, email, full_name FROM users WHERE id = ? AND is_active = TRUE',
                [decoded.userId]
            );

            if (user.length > 0) {
                req.user = {
                    userId: user[0].id,
                    email: user[0].email,
                    fullName: user[0].full_name
                };
            }
        }

        next();
    } catch (error) {
        next();
    }
};

module.exports = {
    authenticateToken,
    optionalAuth
};