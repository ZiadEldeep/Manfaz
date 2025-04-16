/**
 * @swagger
 * tags:
 *   name: User Locations
 *   description: إدارة مواقع المستخدم
 */

/**
 * @swagger
 * /api/user-locations:
 *   get:
 *     summary: الحصول على كل المواقع
 *     tags: [User Locations]
 *     responses:
 *       200:
 *         description: قائمة المواقع
 */

/**
 * @swagger
 * /api/user-locations/{userId}:
 *   get:
 *     summary: الحصول على مواقع مستخدم معين
 *     tags: [User Locations]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: معرف المستخدم
 *     responses:
 *       200:
 *         description: قائمة المواقع الخاصة بالمستخدم
 */

/**
 * @swagger
 * /api/user-locations/{userId}:
 *   post:
 *     summary: إضافة موقع جديد
 *     tags: [User Locations]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: معرف المستخدم
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - address
 *               - city
 *               - latitude
 *               - longitude
 *             properties:
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               type:
 *                 type: string
 *               isDefault:
 *                 type: boolean
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: تم إنشاء الموقع
 */

/**
 * @swagger
 * /api/user-locations/{id}:
 *   put:
 *     summary: تحديث موقع
 *     tags: [User Locations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: معرف الموقع
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: تم تحديث الموقع
 */

/**
 * @swagger
 * /api/user-locations/{id}:
 *   delete:
 *     summary: حذف موقع
 *     tags: [User Locations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: معرف الموقع
 *     responses:
 *       200:
 *         description: تم الحذف بنجاح
 */

/**
 * @swagger
 * /api/user-locations/{id}/set-default:
 *   put:
 *     summary: تعيين موقع كافتراضي
 *     tags: [User Locations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: تم التعيين كافتراضي
 */

const express = require('express');
const protect = require('../middleware/authAdminMiddleware');
const {
  getUserLocations,
  createUserLocation,
  updateUserLocation,
  deleteUserLocation,
  setDefaultLocation,
  getAllUserLocations
} = require('../controllers/userLocationController');

const router = express.Router();

// مسارات مواقع المستخدمين
router.get('/', getAllUserLocations);
router.get('/:userId', getUserLocations);
router.post('/:userId', createUserLocation);
router.put('/:id', updateUserLocation);
router.delete('/:id', deleteUserLocation);
router.put('/:id/set-default', setDefaultLocation);

module.exports = router; 