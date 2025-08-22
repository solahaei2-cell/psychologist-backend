const { executeQuery } = require('../config/database');

// اعتبارسنجی ایمیل
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// اعتبارسنجی رمز عبور (حداقل 8 کاراکتر، شامل حرف و عدد)
const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    return passwordRegex.test(password);
};

// اعتبارسنجی نام کامل (فقط حروف فارسی/عربی و فاصله، حداقل 2 کاراکتر)
const validateFullName = (fullName) => {
    const fullNameRegex = /^[\u0600-\u06FF\s]{2,}$/; 
    return fullNameRegex.test(fullName);
};

// میدلور اعتبارسنجی ثبت‌نام
const validateRegister = (req, res, next) => {
    const { email, password, fullName, phone } = req.body;

    if (!email || !validateEmail(email)) {
        return res.status(400).json({ success: false, message: 'ایمیل نامعتبر است' });
    }

    if (!password || !validatePassword(password)) {
        return res.status(400).json({
            success: false,
            message: 'رمز عبور باید حداقل 8 کاراکتر و شامل حرف و عدد باشد'
        });
    }

    if (!fullName || !validateFullName(fullName)) {
        return res.status(400).json({ success: false, message: 'نام کامل نامعتبر است' });
    }

    if (phone && !/^\+?[\d\s-]{10,}$/.test(phone)) {
        return res.status(400).json({ success: false, message: 'شماره تلفن نامعتبر است' });
    }

    next();
};

// میدلور اعتبارسنجی ورود
const validateLogin = (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !validateEmail(email)) {
        return res.status(400).json({ success: false, message: 'ایمیل نامعتبر است' });
    }

    if (!password) {
        return res.status(400).json({ success: false, message: 'رمز عبور الزامی است' });
    }

    next();
};

// میدلور اعتبارسنجی ارزیابی
const validateAssessment = (req, res, next) => {
    const {
        assessment_type,
        questions,
        answers,
        total_score,
        max_possible_score,
        result_category
    } = req.body;

    if (
        !assessment_type ||
        ![
            'quick_screening',
            'anxiety_gad7',
            'depression_phq9',
            'sleep_quality',
            'life_satisfaction',
            'stress_level',
            'comprehensive'
        ].includes(assessment_type)
    ) {
        return res.status(400).json({ success: false, message: 'نوع ارزیابی نامعتبر است' });
    }

    if (!Array.isArray(questions) || !Array.isArray(answers) || questions.length !== answers.length) {
        return res.status(400).json({ success: false, message: 'سوالات و پاسخ‌ها باید آرایه‌های هم‌اندازه باشند' });
    }

    if (typeof total_score !== 'number' || total_score < 0 || total_score > max_possible_score) {
        return res.status(400).json({ success: false, message: 'امتیاز کل نامعتبر است' });
    }

    if (
        !result_category ||
        !['excellent', 'good', 'moderate', 'concerning', 'critical'].includes(result_category)
    ) {
        return res.status(400).json({ success: false, message: 'دسته‌بندی نتیجه نامعتبر است' });
    }

    next();
};

// چک کردن وجود کاربر
const checkUserExists = async (req, res, next) => {
    try {
        const { email } = req.body;
        const result = await executeQuery('SELECT id FROM users WHERE email = $1', [email]);
        console.log('Database result:', result); // لاگ نتیجه برای بررسی

        if (result && result.length > 0) {
            return res.status(400).json({ success: false, message: 'این ایمیل قبلاً ثبت شده است' });
        }

        next();
    } catch (error) {
        console.error('Database error:', error); // لاگ خطا
        res.status(500).json({ success: false, message: 'خطا در چک کردن کاربر' });
    }
};

module.exports = {
    validateRegister,
    validateLogin,
    validateAssessment,
    checkUserExists
};
