const express = require('express');
const app = express();
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 سرور روان‌شناس هوشمند راه‌اندازی شد! 📍 آدرس: http://localhost:${PORT}`);
});