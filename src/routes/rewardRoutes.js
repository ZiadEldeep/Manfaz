const express = require('express');
const {
  createGiftCard,
  getGiftCards,
  checkGiftCardBalance,
  redeemGiftCard,
  createReward,
  getAllRewards,
  redeemReward,
  getUserRewards,
  updateReward,
  deleteReward
} = require('../controllers/rewardController');

const router = express.Router();

// Gift Cards Routes
router.post('/gift-cards', createGiftCard);
router.get('/stores/:storeId/gift-cards', getGiftCards);
router.get('/gift-cards/:code/balance', checkGiftCardBalance);
router.post('/gift-cards/:code/redeem', redeemGiftCard);

// Rewards Routes
router.post('/rewards', createReward);
router.get('/stores/:storeId/rewards', getAllRewards);
router.post('/rewards/:id/redeem', redeemReward);
router.get('/users/:userId/rewards', getUserRewards);
router.put('/rewards/:id', updateReward);
router.delete('/rewards/:id', deleteReward);

module.exports = router; 