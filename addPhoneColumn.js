const { executeQuery } = require('./database');

(async () => {
  try {
    await executeQuery('ALTER TABLE users ADD COLUMN phone VARCHAR(20);');
    console.log('ستون phone با موفقیت اضافه شد!');
    process.exit(0);
  } catch (err) {
    console.error('خطا در اضافه کردن ستون:', err.message);
    process.exit(1);
  }
})();