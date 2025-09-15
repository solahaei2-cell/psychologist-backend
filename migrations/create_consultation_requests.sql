-- جدول درخواست‌های مشاوره
CREATE TABLE IF NOT EXISTS consultation_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('general', 'therapy', 'diagnosis', 'emergency', 'followup')),
    date VARCHAR(50) NOT NULL,
    time VARCHAR(20) NOT NULL CHECK (time IN ('morning', 'afternoon', 'evening')),
    description TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ایندکس برای بهبود عملکرد
CREATE INDEX IF NOT EXISTS idx_consultation_requests_user_id ON consultation_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_consultation_requests_status ON consultation_requests(status);
CREATE INDEX IF NOT EXISTS idx_consultation_requests_created_at ON consultation_requests(created_at);

-- کامنت برای توضیح جدول
COMMENT ON TABLE consultation_requests IS 'جدول ذخیره درخواست‌های مشاوره آنلاین کاربران';
COMMENT ON COLUMN consultation_requests.type IS 'نوع جلسه: عمومی، درمانی، تشخیصی، اورژانس، پیگیری';
COMMENT ON COLUMN consultation_requests.time IS 'زمان ترجیحی: صبح، بعدازظهر، عصر';
COMMENT ON COLUMN consultation_requests.status IS 'وضعیت درخواست: در انتظار، تایید شده، رد شده، تکمیل شده';
