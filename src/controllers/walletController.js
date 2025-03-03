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

module.exports = {
  getAllWallets,
  getWalletById,
  createTransaction,
  updateTransactionStatus
};
