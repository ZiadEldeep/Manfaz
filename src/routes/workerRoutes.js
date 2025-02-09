const express = require('express');
const { getAllWorkers, createWorker } = require('../controllers/workerController');
const router = express.Router();

router.get('/', getAllWorkers);
router.post('/', createWorker);

module.exports = router;
