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
module.exports = router;



