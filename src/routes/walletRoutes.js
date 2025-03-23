const express = require('express');
const {
  getAllWallets,
  getWalletById,
  createWallet,
  updateWallet,
  deleteWallet,
  getWalletTransactions,
  createTransaction,
  updateTransactionStatus,
  deleteTransaction,
  getUserWallet,
  addBalance,
  deductBalance,
  getWalletTransactionsUser
} = require('../controllers/walletController');

const router = express.Router();

// Wallet Routes
router.get('/', getAllWallets);
router.get('/:id', getWalletById);
router.post('/', createWallet);
router.put('/:id', updateWallet);
router.delete('/:id', deleteWallet);
router.get('/:id/transactions', getWalletTransactions);

router.post('/:id/transactions', createTransaction);
router.put('/:id/transactions/:id', updateTransactionStatus);
router.delete('/:id/transactions/:id', deleteTransaction);
router.get('/:walletId/transactions/user', getWalletTransactionsUser);
router.post('/:id/add-balance', addBalance);
router.post('/:id/deduct-balance', deductBalance);
router.get('/:userId/user', getUserWallet);
module.exports = router;



