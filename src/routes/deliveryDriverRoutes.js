const express = require('express');
const {
  getAllDeliveryDrivers,
  getDeliveryDriverById,
  createDeliveryDriver,
  updateDeliveryDriver,
  deleteDeliveryDriver,
} = require('../controllers/deliveryDriverController');

const router = express.Router();

// DeliveryDriver Routes
router.get('/', getAllDeliveryDrivers); // Get all delivery drivers
router.get('/:id', getDeliveryDriverById); // Get delivery driver by ID
router.post('/', createDeliveryDriver); // Create a new delivery driver
router.put('/:id', updateDeliveryDriver); // Update a delivery driver
router.delete('/:id', deleteDeliveryDriver); // Delete a delivery driver

module.exports = router;
