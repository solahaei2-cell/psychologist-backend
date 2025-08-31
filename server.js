const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root route برای جلوگیری از Cannot GET /
app.get('/', (req, res) => {
  res.send(`
    <html lang="fa" dir="rtl">
      <head><meta charset="utf-8"><title>روان‌شناس هوشمند</title></head>
      <body style="background:#0b1020;color:#eaeaf3;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;">
        <div>
          <h1>🚀 Backend آنلاین است</h1>
          <p>برای بررسی وضعیت <a href="/health" style="color:#9da8ff;">اینجا</a> کلیک کن.</p>
        </div>
      </body>
    </html>
  `);
});

// Routes
const authRoutes = require('./routes/auth');
const assessmentsRoutes = require('./routes/assessments');
const contentRoutes = require('./routes/content');
const usersRoutes = require('./routes/users');
const chatRoutes = require('./routes/chat');

app.use('/api/auth', authRoutes);
app.use('/api/assessments', assessmentsRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/chat', chatRoutes);

// Health Check
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'سرور روان‌شناس هوشمند فعال است',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Error Handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'خطای داخلی سرور' });
});

// تنظیم پورت فقط برای Render
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 سرور روان‌شناس هوشمند راه‌اندازی شد! 📍 آدرس: http://localhost:${PORT}`);
});
