const express = require('express');
const router = express.Router();
const {
    createNotification,
    getNotifications,
    markAsRead,
    deleteNotification
} = require('../controllers/notificationController');

// إنشاء إشعار جديد
router.post('/', createNotification);

// جلب إشعارات مستخدم معين
router.get('/:type/:id', getNotifications);

// تحديث حالة الإشعار كمقروء
router.patch('/:id/mark-as-read', markAsRead);

// حذف إشعار
router.delete('/:id', deleteNotification);

module.exports = router; 