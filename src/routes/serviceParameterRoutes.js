const express = require('express');
const router = express.Router();
const {
  getAllServiceParameters,
  createServiceParameter,
  getServiceParameterById,
  updateServiceParameter,
  deleteServiceParameter
} = require('../controllers/serviceParameterController');

// Get all service parameters
router.get('/', getAllServiceParameters);

// Create a new service parameter
router.post('/', createServiceParameter);

// Get a specific service parameter
router.get('/:id', getServiceParameterById);

// Update a service parameter
router.put('/:id', updateServiceParameter);

// Delete a service parameter
router.delete('/:id', deleteServiceParameter);

module.exports = router;
