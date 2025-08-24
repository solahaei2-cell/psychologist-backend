const { executeQuery } = require('../config/database');

// اعتبارسنجی ایمیل
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// اعتبارسنجی رمز عبور
const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
    console.log(`Password: ${password}, Length: ${password.length}, Valid: ${passwordRegex.test(password)}`);
    return passwordRegex.test(password);
};

// اعتبارسنجی نام کامل
const validateFullName = (fullName) => {
    const fullNameRegex = /^[\u0600-\u06FF\s\u2000-\u200F]{2,}$/;
    console.log(`FullName: ${fullName}, Length: ${fullName.length}, Valid: ${fullNameRegex.test(fullName)}`);
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
        return res.status(400).json({ success: false, message: 'امتیاز کل نامعتبر است