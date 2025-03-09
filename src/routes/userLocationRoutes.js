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
router.get('/users/:userId/', getUserLocations);
router.post('/users/:userId/', createUserLocation);
router.put('/:id', updateUserLocation);
router.delete('/:id', deleteUserLocation);
router.put('/:id/set-default', setDefaultLocation);

module.exports = router; 