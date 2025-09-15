-- جدول ارزیابی‌های روان‌شناسی
CREATE TABLE IF NOT EXISTS assessments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assessment_type VARCHAR(50) NOT NULL CHECK (assessment_type IN ('depression', 'anxiety', 'stress', 'personality')),
    total_score INTEGER DEFAULT 0,
    result TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP NULL
);

-- ایندکس‌ها برای بهبود عملکرد
CREATE INDEX IF NOT EXISTS idx_assessments_user_id ON assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_assessments_type ON assessments(assessment_type);
CREATE INDEX IF NOT EXISTS idx_assessments_created_at ON assessments(created_at);

-- کامنت‌ها
COMMENT ON TABLE assessments IS 'جدول ذخیره ارزیابی‌های روان‌شناسی کاربران';
COMMENT ON COLUMN assessments.assessment_type IS 'نوع ارزیابی: افسردگی، اضطراب، استرس، شخصیت';
COMMENT ON COLUMN assessments.total_score IS 'امتیاز کل ارزیابی';
COMMENT ON COLUMN assessments.result IS 'نتیجه و تفسیر ارزیابی';
