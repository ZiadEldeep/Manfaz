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
router.get('/', protect, getAllUserLocations);
router.get('/:userId', getUserLocations);
router.post('/:userId', createUserLocation);
router.put('/:id', updateUserLocation);
router.delete('/:id', deleteUserLocation);
router.put('/:id/set-default', setDefaultLocation);

module.exports = router; 