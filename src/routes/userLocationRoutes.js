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

/**
 * @swagger
 * tags:
 *   name: User Locations
 *   description: إدارة مواقع المستخدم
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     UserLocation:
 *       type: object
 *       required:
 *         - name
 *         - address
 *         - city
 *         - latitude
 *         - longitude
 *       properties:
 *         _id:
 *           type: string
 *         userId:
 *           type: string
 *         name:
 *           type: string
 *         address:
 *           type: string
 *         city:
 *           type: string
 *         latitude:
 *           type: number
 *         longitude:
 *           type: number
 *         isDefault:
 *           type: boolean
 *       example:
 *         _id: 6438bc4f0e0f5c5fbc123456
 *         userId: 6438bc4f0e0f5c5fbc654321
 *         name: المنزل
 *         address: 123 شارع الثورة
 *         city: القاهرة
 *         latitude: 30.0444
 *         longitude: 31.2357
 *         isDefault: true
 */

/**
 * @swagger
 * /locations:
 *   get:
 *     summary: الحصول على كل المواقع
 *     tags: [User Locations]
 *     responses:
 *       200:
 *         description: قائمة المواقع
 */
router.get('/', getAllUserLocations);

/**
 * @swagger
 * /locations/{userId}:
 *   get:
 *     summary: الحصول على مواقع مستخدم معين
 *     tags: [User Locations]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: قائمة المواقع الخاصة بالمستخدم
 */
router.get('/:userId', getUserLocations);

/**
 * @swagger
 * /locations/{userId}:
 *   post:
 *     summary: إضافة عنوان جديد
 *     tags: [User Locations]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserLocation'
 *     responses:
 *       201:
 *         description: تم الإضافة بنجاح
 */
router.post('/:userId', createUserLocation);

/**
 * @swagger
 * /locations/{id}:
 *   put:
 *     summary: تحديث موقع
 *     tags: [User Locations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserLocation'
 *     responses:
 *       200:
 *         description: تم تحديث الموقع
 */
router.put('/:id', updateUserLocation);

/**
 * @swagger
 * /locations/{id}:
 *   delete:
 *     summary: حذف موقع
 *     tags: [User Locations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: تم الحذف بنجاح
 */
router.delete('/:id', deleteUserLocation);

/**
 * @swagger
 * /locations/{id}/set-default:
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
router.put('/:id/set-default', setDefaultLocation);

module.exports = router;
