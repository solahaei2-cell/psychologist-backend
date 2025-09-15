-- جدول پاسخ‌های جزئی ارزیابی‌ها
CREATE TABLE IF NOT EXISTS assessment_answers (
    id SERIAL PRIMARY KEY,
    assessment_id INTEGER NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    question_id VARCHAR(50) NOT NULL,
    answer_value TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ایندکس برای بهبود عملکرد
CREATE INDEX IF NOT EXISTS idx_assessment_answers_assessment_id ON assessment_answers(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_answers_question_id ON assessment_answers(question_id);

-- کامنت‌ها
COMMENT ON TABLE assessment_answers IS 'جدول ذخیره پاسخ‌های جزئی هر ارزیابی';
COMMENT ON COLUMN assessment_answers.question_id IS 'شناسه سوال در ارزیابی';
COMMENT ON COLUMN assessment_answers.answer_value IS 'مقدار پاسخ داده شده';
