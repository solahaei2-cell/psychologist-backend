const express = require('express');
const router = express.Router();
const { migrate } = require('../migration'); // فرض بر اینه که migrate تابع export شده از migration.js هست

// route موقت برای اجرای migration
router.get('/', async (req, res) => {
    try {
        await migrate();
        res.json({ success: true, message: 'Migration executed successfully!' });
    } catch (err) {
        console.error('Migration failed:', err);
        res.status(500).json({ success: false, message: 'Migration failed', error: err.message });
    }
});

module.exports = router;
