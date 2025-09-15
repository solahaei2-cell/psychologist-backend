const fs = require('fs');
const path = require('path');
const { executeQuery } = require('../config/database');

async function runMigrations() {
    try {
        console.log('🚀 شروع اجرای migration ها...');

        // لیست فایل‌های migration
        const migrationFiles = [
            'create_assessments.sql',
            'create_consultation_requests.sql',
            'create_user_content_progress.sql', 
            'create_assessment_answers.sql'
        ];

        for (const file of migrationFiles) {
            const filePath = path.join(__dirname, file);
            
            if (fs.existsSync(filePath)) {
                console.log(`📄 در حال اجرای ${file}...`);
                const sql = fs.readFileSync(filePath, 'utf8');
                await executeQuery(sql);
                console.log(`✅ ${file} با موفقیت اجرا شد`);
            } else {
                console.log(`⚠️ فایل ${file} یافت نشد`);
            }
        }

        console.log('🎉 همه migration ها با موفقیت اجرا شدند!');
    } catch (error) {
        console.error('❌ خطا در اجرای migration ها:', error);
        process.exit(1);
    }
}

// اگر این فایل مستقیماً اجرا شود
if (require.main === module) {
    runMigrations();
}

module.exports = { runMigrations };
