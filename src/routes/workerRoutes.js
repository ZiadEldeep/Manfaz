const express = require('express');
const { getAllWorkers, createWorker, getWorkerById, updateWorker, deleteWorker, getAllReviews, createReview, updateReview, deleteReview } = require('../controllers/workerController');
const router = express.Router();
// worker
router.get('/', getAllWorkers);
router.post('/', createWorker);
router.get('/:id', getWorkerById);
router.put('/:id', updateWorker);
router.delete('/:id', deleteWorker);
router.get(`/workers/:workerId/reviews`, getAllReviews);
router.post(`/workers/:workerId/reviews`, createReview);
router.put(`/workers/:workerId/reviews/:id`, updateReview);
router.delete(`/workers/:workerId/reviews/:id`, deleteReview);
module.exports = router;
