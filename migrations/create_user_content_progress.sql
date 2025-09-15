-- جدول پیشرفت محتوای کاربران
CREATE TABLE IF NOT EXISTS user_content_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content_id VARCHAR(100) NOT NULL,
    content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('article', 'video', 'exercise', 'course')),
    completed BOOLEAN DEFAULT FALSE,
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    time_spent INTEGER DEFAULT 0, -- به ثانیه
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, content_id)
);

-- ایندکس‌ها برای بهبود عملکرد
CREATE INDEX IF NOT EXISTS idx_user_content_progress_user_id ON user_content_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_content_progress_completed ON user_content_progress(completed);
CREATE INDEX IF NOT EXISTS idx_user_content_progress_content_type ON user_content_progress(content_type);

-- کامنت‌ها
COMMENT ON TABLE user_content_progress IS 'جدول ردیابی پیشرفت کاربران در محتوای آموزشی';
COMMENT ON COLUMN user_content_progress.content_id IS 'شناسه محتوا (مقاله، ویدیو، تمرین و غیره)';
COMMENT ON COLUMN user_content_progress.progress_percentage IS 'درصد پیشرفت از 0 تا 100';
COMMENT ON COLUMN user_content_progress.time_spent IS 'زمان صرف شده بر حسب ثانیه';
