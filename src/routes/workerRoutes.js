const express = require('express');
const protect = require('../middleware/authAdminMiddleware');
const { getAllWorkers, createWorker, getWorkerById, updateWorker, deleteWorker, getAllReviews, createReview, updateReview, deleteReview, updateSchedule, updateAvailability } = require('../controllers/workerController');
const router = express.Router();

// مسارات العمال
router.get('/', getAllWorkers);
router.post('/', createWorker);
router.get('/:id', getWorkerById);
router.put('/:id', updateWorker);
router.delete('/:id', deleteWorker);
router.put('/:id/availability', updateAvailability);
router.get(`/workers/:workerId/reviews`, getAllReviews);
router.post(`/workers/:workerId/reviews`, createReview);
router.put(`/workers/:workerId/reviews/:id`, updateReview);
router.delete(`/workers/:workerId/reviews/:id`, deleteReview);
router.put(`/workers/:workerId/schedule`, updateSchedule);

router.put('/:workerId/reviews/:id', protect, updateReview);
router.delete('/:workerId/reviews/:id', protect, deleteReview);

// مسارات الجدول
router.put('/:workerId/schedule', updateSchedule);

module.exports = router;
