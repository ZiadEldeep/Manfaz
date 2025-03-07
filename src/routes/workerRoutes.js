const express = require('express');
const { getAllWorkers, createWorker, getWorkerById, updateWorker, deleteWorker } = require('../controllers/workerController');
const router = express.Router();
// worker
router.get('/', getAllWorkers);
router.post('/', createWorker);
router.get('/:id', getWorkerById);
router.put('/:id', updateWorker);
router.delete('/:id', deleteWorker);

module.exports = router;
