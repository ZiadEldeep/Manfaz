const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { translate } = require('translate-google');

// إنشاء بطاقة هدايا جديدة
const createGiftCard = async (req, res) => {
  const lang = req.query.lang || 'ar';
  try {
    const { storeId, amount, expiryDate, numberOfCards = 1 } = req.body;

    if (!storeId || !amount) {
      const message = await translate('Store ID and amount are required', { to: lang });
      return res.status(400).json({ status: false, message, code: 400, data: null });
    }

    const giftCards = [];
    
    for (let i = 0; i < numberOfCards; i++) {
      // إنشاء كود فريد من 16 رقم
      const code = Math.random().toString(36).substring(2, 8).toUpperCase() + 
                  Date.now().toString(36).substring(-6).toUpperCase();
      
      const giftCard = await prisma.giftCard.create({
        data: {
          storeId,
          code,
          amount,
          balance: amount,
          expiryDate: expiryDate ? new Date(expiryDate) : null
        }
      });
      
      giftCards.push(giftCard);
    }

    const message = await translate('Gift cards created successfully', { to: lang });
    res.status(201).json({
      status: true,
      message,
      code: 201,
      data: giftCards
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

// الحصول على بطاقات الهدايا للمتجر
const getGiftCards = async (req, res) => {
  const lang = req.query.lang || 'ar';
  try {
    const { storeId } = req.params;
    const { isActive, hasBalance } = req.query;

    const where = {
      storeId,
      ...(isActive !== undefined && { isActive: isActive === 'true' }),
      ...(hasBalance === 'true' && { balance: { gt: 0 } })
    };

    const giftCards = await prisma.giftCard.findMany({ where });

    const message = await translate('Gift cards retrieved successfully', { to: lang });
    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: giftCards
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

// التحقق من رصيد بطاقة الهدايا
const checkGiftCardBalance = async (req, res) => {
  const lang = req.query.lang || 'ar';
  try {
    const { code } = req.params;

    const giftCard = await prisma.giftCard.findUnique({
      where: { code }
    });

    if (!giftCard) {
      const message = await translate('Gift card not found', { to: lang });
      return res.status(404).json({ status: false, message, code: 404, data: null });
    }

    if (!giftCard.isActive) {
      const message = await translate('Gift card is inactive', { to: lang });
      return res.status(400).json({ status: false, message, code: 400, data: null });
    }

    if (giftCard.expiryDate && new Date() > giftCard.expiryDate) {
      const message = await translate('Gift card has expired', { to: lang });
      return res.status(400).json({ status: false, message, code: 400, data: null });
    }

    const message = await translate('Gift card balance retrieved successfully', { to: lang });
    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: {
        code: giftCard.code,
        balance: giftCard.balance,
        expiryDate: giftCard.expiryDate
      }
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

// استخدام بطاقة الهدايا
const redeemGiftCard = async (req, res) => {
  const lang = req.query.lang || 'ar';
  try {
    const { code } = req.params;
    const { amount } = req.body;

    const giftCard = await prisma.giftCard.findUnique({
      where: { code }
    });

    if (!giftCard) {
      const message = await translate('Gift card not found', { to: lang });
      return res.status(404).json({ status: false, message, code: 404, data: null });
    }

    if (!giftCard.isActive) {
      const message = await translate('Gift card is inactive', { to: lang });
      return res.status(400).json({ status: false, message, code: 400, data: null });
    }

    if (giftCard.expiryDate && new Date() > giftCard.expiryDate) {
      const message = await translate('Gift card has expired', { to: lang });
      return res.status(400).json({ status: false, message, code: 400, data: null });
    }

    if (amount > giftCard.balance) {
      const message = await translate('Insufficient balance', { to: lang });
      return res.status(400).json({ status: false, message, code: 400, data: null });
    }

    const updatedGiftCard = await prisma.giftCard.update({
      where: { code },
      data: {
        balance: giftCard.balance - amount,
        isActive: giftCard.balance - amount > 0
      }
    });

    const message = await translate('Gift card redeemed successfully', { to: lang });
    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: updatedGiftCard
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

// إنشاء مكافأة جديدة
const createReward = async (req, res) => {
  const lang = req.query.lang || 'ar';
  try {
    const { 
      storeId, 
      name, 
      description, 
      type, 
      value, 
      pointsCost 
    } = req.body;

    if (!storeId || !name || !type || !value || !pointsCost) {
      const message = await translate('All fields are required', { to: lang });
      return res.status(400).json({ status: false, message, code: 400, data: null });
    }

    const reward = await prisma.reward.create({
      data: {
        storeId,
        name,
        description,
        type,
        value,
        pointsCost
      }
    });

    const message = await translate('Reward created successfully', { to: lang });
    res.status(201).json({
      status: true,
      message,
      code: 201,
      data: reward
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

// الحصول على المكافآت المتاحة في المتجر
const getRewards = async (req, res) => {
  const lang = req.query.lang || 'ar';
  try {
    const { storeId } = req.params;
    const { isActive } = req.query;

    const where = {
      storeId,
      ...(isActive !== undefined && { isActive: isActive === 'true' })
    };

    const rewards = await prisma.reward.findMany({ where });

    const message = await translate('Rewards retrieved successfully', { to: lang });
    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: rewards
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

module.exports = {
  createGiftCard,
  getGiftCards,
  checkGiftCardBalance,
  redeemGiftCard,
  createReward,
  getRewards,
  redeemReward,
  getUserRewards
}; 