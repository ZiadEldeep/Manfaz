const prisma = require('../prismaClient');
const translate = require('translate-google');

// Get All Wallets
const getAllWallets = async (req, res) => {
  const lang = req.query.lang || 'en';
  try {
    const wallets = await prisma.wallet.findMany({
      include: {
        transactions: true,
        user: true
      }
    });

    const message = await translate('Wallets retrieved successfully', { to: lang });

    if (lang === 'en') {
      res.status(200).json({
        status: true,
        message,
        code: 200,
        data: wallets
      });
      return;
    }

    // ترجمة جميع المحافظ وأسماء المستخدمين في وقت واحد
    const translatedWallets = await Promise.all(wallets.map(async (wallet) => ({
      ...wallet,
      user: wallet.user ? {
        ...wallet.user,
        name: await translate(wallet.user.name, { to: lang })
      } : null,
      transactions: await Promise.all(wallet.transactions.map(async (transaction) => ({
        ...transaction,
        type: await translate(transaction.type, { to: lang }),
        status: await translate(transaction.status, { to: lang })
      })))
    })));

    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: translatedWallets
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

// Get Wallet By ID
const getWalletById = async (req, res) => {
  const lang = req.query.lang || 'en';
  try {
    const { id } = req.params;
    
    const wallet = await prisma.wallet.findUnique({
      where: { id },
      include: {
        transactions: true,
        user: true
      }
    });

    if (!wallet) {
      const message = await translate('Wallet not found', { to: lang });
      return res.status(404).json({ status: false, message, code: 404, data: null });
    }

    const message = await translate('Wallet retrieved successfully', { to: lang });

    if (lang === 'en') {
      res.status(200).json({
        status: true,
        message,
        code: 200,
        data: wallet
      });
      return;
    }

    // ترجمة بيانات المحفظة والمستخدم والمعاملات
    const [translatedUser, translatedTransactions] = await Promise.all([
      wallet.user ? {
        ...wallet.user,
        name: await translate(wallet.user.name, { to: lang })
      } : null,
      Promise.all(wallet.transactions.map(async (transaction) => ({
        ...transaction,
        type: await translate(transaction.type, { to: lang }),
        status: await translate(transaction.status, { to: lang })
      })))
    ]);

    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: {
        ...wallet,
        user: translatedUser,
        transactions: translatedTransactions
      }
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};
// create wallet
const createWallet = async (req, res) => {
  const lang = req.query.lang || 'en';
  try {
    const { userId } = req.body;
    if (!userId) {
      const message = await translate('User ID is required', { to: lang });
      return res.status(400).json({ status: false, message, code: 400, data: null });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    if (!user) {
      const message = await translate('User not found', { to: lang });
      return res.status(404).json({ status: false, message, code: 404, data: null });
    }

    const wallet = await prisma.wallet.create({
      data: {
        userId,
        balance: 0
      }
    });

    const message = await translate('Wallet created successfully', { to: lang });
    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: wallet
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

// update wallet
const updateWallet = async (req, res) => {
  const lang = req.query.lang || 'en';
  try {
    const { id } = req.params;
    const { balance } = req.body;
    if (!id || !balance) {
      const message = await translate('Wallet ID and balance are required', { to: lang });
      return res.status(400).json({ status: false, message, code: 400, data: null });
    }

    const wallet = await prisma.wallet.findUnique({
      where: { id }
    });
    if (!wallet) {
      const message = await translate('Wallet not found', { to: lang });
      return res.status(404).json({ status: false, message, code: 404, data: null });
    }

    const updatedWallet = await prisma.wallet.update({
      where: { id },
      data: {
        balance
      }
    });

    const message = await translate('Wallet updated successfully', { to: lang });
    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: updatedWallet
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};
// delete wallet
const deleteWallet = async (req, res) => {
  const lang = req.query.lang || 'en';
  try {
    const { id } = req.params;
    if (!id) {
      const message = await translate('Wallet ID is required', { to: lang });
      return res.status(400).json({ status: false, message, code: 400, data: null });
    }

    const wallet = await prisma.wallet.findUnique({
      where: { id }
    });
    if (!wallet) {
      const message = await translate('Wallet not found', { to: lang });
      return res.status(404).json({ status: false, message, code: 404, data: null });
    }

    await prisma.wallet.delete({
      where: { id }
    });

    const message = await translate('Wallet deleted successfully', { to: lang });
    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: null
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};
// get wallet transactions
const getWalletTransactions = async (req, res) => {
  const lang = req.query.lang || 'en';
  try {
    const { walletId } = req.params;
    if (!walletId) {
      const message = await translate('Wallet ID is required', { to: lang });
      return res.status(400).json({ status: false, message, code: 400, data: null });
    }

    const wallet = await prisma.wallet.findUnique({
      where: { id: walletId }
    });

    if (!wallet) {
      const message = await translate('Wallet not found', { to: lang });
      return res.status(404).json({ status: false, message, code: 404, data: null });
    }

    const transactions = await prisma.transaction.findMany({
      where: { walletId },
      include: {
        wallet: true
      }
    });

    res.status(200).json({
      status: true,
      message: await translate('Wallet transactions retrieved successfully', { to: lang }),
      code: 200,
      data: transactions
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};
// Create Transaction
const createTransaction = async (req, res) => {
  const lang = req.query.lang || 'en';
  try {
    const { walletId, type, amount } = req.body;

    if (!walletId || !type || !amount) {
      const message = await translate('Wallet ID, type and amount are required', { to: lang });
      return res.status(400).json({ status: false, message, code: 400, data: null });
    }

    const wallet = await prisma.wallet.findUnique({
      where: { id: walletId }
    });

    if (!wallet) {
      const message = await translate('Wallet not found', { to: lang });
      return res.status(404).json({ status: false, message, code: 404, data: null });
    }

    // ترجمة نوع المعاملة إلى الإنجليزية
    const translatedType = await translate(type, { to: "en" });

    const newTransaction = await prisma.transaction.create({
      data: {
        walletId,
        type: translatedType,
        amount,
        status: "pending"
      }
    });

    // تحديث رصيد المحفظة
    const updatedWallet = await prisma.wallet.update({
      where: { id: walletId },
      data: {
        balance: type.toLowerCase() === 'deposit' 
          ? wallet.balance + amount 
          : wallet.balance - amount
      }
    });

    const message = await translate('Transaction created successfully', { to: lang });

    if (lang === 'en') {
      res.status(201).json({
        status: true,
        message,
        code: 201,
        data: { transaction: newTransaction, wallet: updatedWallet }
      });
      return;
    }

    // ترجمة بيانات المعاملة للغة المطلوبة
    const [finalType, finalStatus] = await Promise.all([
      translate(newTransaction.type, { to: lang }),
      translate(newTransaction.status, { to: lang })
    ]);

    res.status(201).json({
      status: true,
      message,
      code: 201,
      data: {
        transaction: {
          ...newTransaction,
          type: finalType,
          status: finalStatus
        },
        wallet: updatedWallet
      }
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

// Update Transaction Status
const updateTransactionStatus = async (req, res) => {
  const lang = req.query.lang || 'en';
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      const message = await translate('Status is required', { to: lang });
      return res.status(400).json({ status: false, message, code: 400, data: null });
    }

    // ترجمة الحالة إلى الإنجليزية
    const translatedStatus = await translate(status, { to: "en" });

    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: { status: translatedStatus }
    });

    const message = await translate('Transaction status updated successfully', { to: lang });

    if (lang === 'en') {
      res.status(200).json({
        status: true,
        message,
        code: 200,
        data: updatedTransaction
      });
      return;
    }

    // ترجمة بيانات المعاملة المحدثة للغة المطلوبة
    const [finalType, finalStatus] = await Promise.all([
      translate(updatedTransaction.type, { to: lang }),
      translate(updatedTransaction.status, { to: lang })
    ]);

    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: {
        ...updatedTransaction,
        type: finalType,
        status: finalStatus
      }
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

const deleteTransaction = async (req, res) => {
  const { id } = req.params;
  const { lang } = req.query;
  
  try {
    const message = await translate('Transaction deleted successfully', { to: lang });
    res.status(200).json({ status: true, message, code: 200, data: null });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};


module.exports = {
  getAllWallets,
  getWalletById,
  createWallet,
  updateWallet,
  deleteWallet,
  getWalletTransactions,
  createTransaction,
  updateTransactionStatus,
  deleteTransaction
};
