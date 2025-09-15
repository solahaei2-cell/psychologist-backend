// اسکریپت برای اجرای migration ها روی production
const { runMigrations } = require('./migrations/run_migrations');

console.log('🚀 اجرای migration ها روی production...');
runMigrations()
    .then(() => {
        console.log('✅ همه migration ها با موفقیت اجرا شدند!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ خطا در اجرای migration ها:', error);
        process.exit(1);
    });
