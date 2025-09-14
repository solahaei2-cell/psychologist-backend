const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();

// میدل‌ورها
app.use(cors());
app.use(bodyParser.json());

// 📌 routeها
app.use('/api/users', require('./routes/users'));
app.use('/api/recommendations', require('./routes/recommendations'));
app.use('/api/assessments', require('./routes/assessments'));
app.use('/api/stats', require('./routes/stats'));

// تست سالم بودن سرور
app.get('/', (req, res) => {
    res.send('✅ Server is running...');
});

// پورت از .env یا پیشفرض 5000
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
