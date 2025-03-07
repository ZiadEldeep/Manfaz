const express = require('express');
const {
  getStoreWorkingHours,
  setStoreWorkingHours,
  updateWorkingHours,
  addSpecialDay,
  deleteSpecialDay,
  checkStoreOpen
} = require('../controllers/storeWorkingHoursController');

const router = express.Router();

// store working hours
router.get('/stores/:storeId/working-hours', getStoreWorkingHours);
router.post('/stores/:storeId/working-hours', setStoreWorkingHours);
router.put('/stores/:storeId/working-hours/:dayOfWeek', updateWorkingHours);
router.post('/stores/:storeId/special-days', addSpecialDay);
router.delete('/stores/:storeId/special-days/:id', deleteSpecialDay);
router.get('/stores/:storeId/check-open', checkStoreOpen);

module.exports = router; 