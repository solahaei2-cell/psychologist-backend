const { executeQuery } = require('../config/database');

// گرفتن پروفایل کاربر
const getUserProfile = async (req, res) => {
    try {
        const result = await executeQuery(
            'SELECT id, email, full_name, phone, total_points FROM users WHERE id = $1',
            [req.user.userId]
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطا در بارگذاری پروفایل' });
    }
};

module.exports = {
    getUserProfile
};