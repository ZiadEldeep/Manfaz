const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const  translate  = require('translate-google');

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

// الحصول على جميع المكافآت
const getAllRewards = async (req, res) => {
  const lang = req.query.lang || 'ar';
  try {
    const rewards = await prisma.reward.findMany({
      include: {
        user: true
      }
    });

    // إرسال تحديث للوحة التحكم
    if (req.io) {
      req.io.to('admin').emit('rewardsUpdated', rewards);
    }

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

// إنشاء مكافأة جديدة
const createReward = async (req, res) => {
  const lang = req.query.lang || 'ar';
  try {
    const { userId, points, type, description, expiryDate } = req.body;

    if (!userId || !points || !type) {
      const message = await translate('User ID, points, and type are required', { to: lang });
      return res.status(400).json({ status: false, message, code: 400, data: null });
    }

    // ترجمة الوصف والنوع إلى الإنجليزية
    const [translatedType, translatedDescription] = await Promise.all([
      translate(type, { to: 'en' }),
      description ? translate(description, { to: 'en' }) : null
    ]);

    const newReward = await prisma.reward.create({
      data: {
        userId,
        points,
        type: translatedType,
        description: translatedDescription,
        expiryDate,
        isActive: true
      },
      include: {
        user: true
      }
    });

    // إرسال إشعارات
    if (req.io) {
      // إشعار للمستخدم
      req.io.to(`user_${userId}`).emit('newReward', {
        ...newReward,
        type: await translate(newReward.type, { to: lang }),
        description: newReward.description ? await translate(newReward.description, { to: lang }) : null
      });

      // إشعار للوحة التحكم
      req.io.to('admin').emit('rewardCreated', newReward);
    }

    const message = await translate('Reward created successfully', { to: lang });
    res.status(201).json({
      status: true,
      message,
      code: 201,
      data: newReward
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

// استخدام المكافأة
const redeemReward = async (req, res) => {
  const lang = req.query.lang || 'ar';
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const reward = await prisma.reward.findFirst({
      where: {
        id,
        userId,
        isActive: true,
        expiryDate: {
          gt: new Date()
        }
      }
    });

    if (!reward) {
      const message = await translate('Invalid or expired reward', { to: lang });
      return res.status(400).json({ status: false, message, code: 400, data: null });
    }

    const updatedReward = await prisma.reward.update({
      where: { id },
      data: {
        isActive: false,
        redeemedAt: new Date()
      },
      include: {
        user: true
      }
    });

    // إرسال إشعارات
    if (req.io) {
      // إشعار للمستخدم
      req.io.to(`user_${userId}`).emit('rewardRedeemed', {
        ...updatedReward,
        type: await translate(updatedReward.type, { to: lang }),
        description: updatedReward.description ? 
          await translate(updatedReward.description, { to: lang }) : null
      });

      // إشعار للوحة التحكم
      req.io.to('admin').emit('rewardRedeemed', updatedReward);
    }

    const message = await translate('Reward redeemed successfully', { to: lang });
    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: updatedReward
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};

// الحصول على مكافآت المستخدم
const getUserRewards = async (req, res) => {
  const lang = req.query.lang || 'ar';
  try {
    const { userId } = req.params;

    const rewards = await prisma.reward.findMany({
      where: {
        userId,
        isActive: true,
        expiryDate: {
          gt: new Date()
        }
      },
      include: {
        user: true
      }
    });

    // ترجمة المكافآت
    const translatedRewards = await Promise.all(rewards.map(async (reward) => ({
      ...reward,
      type: await translate(reward.type, { to: lang }),
      description: reward.description ? 
        await translate(reward.description, { to: lang }) : null
    })));

    const message = await translate('User rewards retrieved successfully', { to: lang });
    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: translatedRewards
    });
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};
const updateReward = async (req, res) => {
  const lang = req.query.lang || 'ar';
  try {
    const { id } = req.params;
    const { userId, points, type, description, expiryDate } = req.body;

    const reward = await prisma.reward.findUnique({
      where: { id }
    });

    if (!reward) {
      const message = await translate('Reward not found', { to: lang });
      return res.status(404).json({ status: false, message, code: 404, data: null });
    } 

    const updatedReward = await prisma.reward.update({
      where: { id },
      data: { userId, points, type, description, expiryDate }
    });

    const message = await translate('Reward updated successfully', { to: lang });
    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: updatedReward
    }); 
  } catch (error) {
    const message = await translate(error.message, { to: lang });
    res.status(500).json({ status: false, message, code: 500, data: null });
  }
};      



// حذف مكافأة
const deleteReward = async (req, res) => {
  const lang = req.query.lang || 'ar';
  try {
    const { id } = req.params;

    const reward = await prisma.reward.findUnique({
      where: { id },
      include: {
        user: true
      }
    });

    if (!reward) {
      const message = await translate('Reward not found', { to: lang });
      return res.status(404).json({ status: false, message, code: 404, data: null });
    }

    await prisma.reward.delete({
      where: { id }
    });

    // إرسال إشعارات
    if (req.io) {
      // إشعار للمستخدم
      req.io.to(`user_${reward.userId}`).emit('rewardDeleted', {
        id,
        type: await translate(reward.type, { to: lang })
      });

      // إشعار للوحة التحكم
      req.io.to('admin').emit('rewardDeleted', { id });
    }

    const message = await translate('Reward deleted successfully', { to: lang });
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

module.exports = {
  createGiftCard,
  getGiftCards,
  checkGiftCardBalance,
  redeemGiftCard,
  getAllRewards,
  createReward,
  redeemReward,
  getUserRewards,
  deleteReward,
  updateReward
}; 