const express = require('express');
const {
  getUserLocations,
  createUserLocation,
  updateUserLocation,
  deleteUserLocation,
  setDefaultLocation,
  getAllUserLocations
} = require('../controllers/userLocationController');

const router = express.Router();

// User Locations
router.get("/", getAllUserLocations)
router.get('/users/:userId/locations', getUserLocations);
router.post('/users/:userId/locations', createUserLocation);
router.put('/locations/:id', updateUserLocation);
router.delete('/locations/:id', deleteUserLocation);
router.put('/locations/:id/set-default', setDefaultLocation);

module.exports = router; 