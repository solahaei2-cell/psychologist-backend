// اجرا در روت پروژه: node addPhoneColumn.js
const { executeQuery } = require('./config/database');

(async () => {
  try {
    // IF NOT EXISTS برای جلوگیری از خطا در صورت وجود قبلی ستون
    await executeQuery('ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);');
    console.log('✅ ستون phone با موفقیت اضافه شد (یا قبلاً وجود داشت).');
    process.exit(0);
  } catch (err) {
    console.error('❌ خطا در اضافه کردن ستون phone:', err.message);
    process.exit(1);
  }
})();