const express = require('express');
const router = express.Router();
const tapService = require('../payments/tapService');
const paypalService = require('../payments/paypalService');
const axios = require('axios');
const authenticateToken = require('../middleware/authMiddleware');
// <-------payment------->
const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY;
const PAYMOB_INTEGRATION_ID = process.env.PAYMOB_INTEGRATION_ID;
const PAYMOB_MERCHANT_ID = process.env.PAYMOB_MERCHANT_ID;
const PAYMOB_BASE_URL = process.env.PAYMOB_BASE_URL;
const PAYMOB_IFRAME_ID = process.env.PAYMOB_IFRAME_ID;

// Step 1: Authenticate with Paymob
async function authenticate() {
    try {
        const response = await axios.post(`${PAYMOB_BASE_URL}/auth/tokens`, {
            api_key: PAYMOB_API_KEY,
        });
        return response.data.token;
    } catch (error) {
        console.error(
            "Authentication failed:",
            error.response?.data || error.message
        );
        throw error;
    }
}

// Step 2: Create an order
async function createOrder(
    token,
    amount,
    currency,
    items,
) {
    try {
        const response = await axios.post(
            `${PAYMOB_BASE_URL}/ecommerce/orders`,
            {
                auth_token: token,
                delivery_needed: "false",
                amount_cents: amount * 100, // amount in cents (e.g., 500 SAR = 50000)
                currency: currency,
                items,
                merchant_order_ext_ref: 'order' + Date.now() // unique order reference
            }
        );

        if (response.status === 201) {
            // console.log('Payment Order Created:', response.data);
            return response.data;
        } else {
            console.error('Failed to create payment order:', response.data);
        }
        // Paymob's order ID
    } catch (error) {
        console.error(
            "Order creation failed:",
            error.response?.data || error.message
        );
        throw error;
    }
}

// Step 3: Generate a payment key
async function generatePaymentKey(
    token,
    orderId,
    amount,
    currency,
    integrationId,
    billingData
) {
    try {
        const response = await axios.post(
            `${PAYMOB_BASE_URL}/acceptance/payment_keys`,
            {
                auth_token: token,
                amount_cents: amount * 100,
                expiration: 3600, // Key expiration time in seconds
                order_id: orderId,
                billing_data: billingData,
                currency,
                integration_id: integrationId, // Your PAYMOB_INTEGRATION_ID
            }
        );
        return response.data.token; // Payment key
    } catch (error) {
        console.error(
            "Payment key generation failed:",
            error.response?.data || error.message
        );
        throw error;
    }
}

router.post("/", async (req, res) => {
    try {
        const {
            amount,
            currency,
            items,
            billing_data,
            redirectUrl,
        } = req.body;

        // Step 1: Authenticate
        const token = await authenticate();
        console.log(token);

        // Step 2: Create an order
        const orderIdPaymob = await createOrder(
            token,
            amount,
            currency,
            items,
        );

        // Step 3: Generate payment key
        const paymentKey = await generatePaymentKey(
            token,
            orderIdPaymob.id,
            amount,
            currency,
            PAYMOB_INTEGRATION_ID,
            billing_data
        );

        // Step 4: Generate payment link
        const paymentLink = `${PAYMOB_BASE_URL}/acceptance/iframes/${PAYMOB_IFRAME_ID}?payment_token=${paymentKey}`;

        // Step 5: Send payment link to frontend
        res.status(200).json({ paymentLink });
    } catch (error) {
        console.error("Error creating payment:", error);
        res
            .status(500)
            .json({ error: "Internal server error", details: error.message });
    }
});
// إنشاء عملية دفع جديدة
router.post('/create-payment', authenticateToken, async (req, res) => {
    try {
        const paymentData = {
            amount: req.body.amount,
            description: req.body.description,
            customerName: req.body.customerName,
            customerEmail: req.body.customerEmail,
            customerPhone: req.body.customerPhone,
            sourceId: req.body.sourceId,
            redirectUrl: req.body.redirectUrl,
            transactionId: req.body.transactionId,
            orderId: req.body.orderId
        };

        const result = await tapService.createPayment(paymentData);

        if (result.success) {
            res.json({
                status: true,
                message: 'تم إنشاء عملية الدفع بنجاح',
                data: result.data
            });
        } else {
            res.status(400).json({
                status: false,
                message: 'فشل في إنشاء عملية الدفع',
                error: result.error
            });
        }
    } catch (error) {
        res.status(500).json({
            status: false,
            message: 'حدث خطأ في الخادم',
            error: error.message
        });
    }
});
router.post("/webhook", async (req, res) => {
    const body = req.body;
    try {

        // Tap سترسل لك status: CAPTURED أو PAID
        if (body.status === 'CAPTURED' || body.status === 'PAID') {
            const userId = body.metadata?.userId;
            const amount = body.amount;

            if (userId && amount) {
                let user = await prisma.user.findUnique({
                    where: { id: userId },
                });

                if (!user) {
                    return res.status(404).json({
                        status: false,
                        message: 'المستخدم غير موجود',
                        code: 404,
                        data: null
                    });
                }

                await prisma.wallet.update({
                    where: { userId },
                    data: { balance: { increment: amount } },
                });
            }
        } else {
            return res.status(400).json({
                status: false,
                message: 'الحالة غير صحيحة',
                code: 400,
                data: null
            });
        }

    } catch (error) {
        res.status(500).json({
            status: false,
            message: 'حدث خطأ في الخادم',
            error: error.message
        });
    }
})

// استرجاع معلومات عملية دفع
router.get('/payment/:chargeId', authenticateToken, async (req, res) => {
    try {
        const result = await tapService.retrievePayment(req.params.chargeId);

        if (result.success) {
            res.json({
                status: true,
                message: 'تم استرجاع معلومات عملية الدفع بنجاح',
                data: result.data
            });
        } else {
            res.status(400).json({
                status: false,
                message: 'فشل في استرجاع معلومات عملية الدفع',
                error: result.error
            });
        }
    } catch (error) {
        res.status(500).json({
            status: false,
            message: 'حدث خطأ في الخادم',
            error: error.message
        });
    }
});

// استرداد المبلغ
router.post('/refund/:chargeId', authenticateToken, async (req, res) => {
    try {
        const result = await tapService.refundPayment(req.params.chargeId, req.body.amount);

        if (result.success) {
            res.json({
                status: true,
                message: 'تم استرداد المبلغ بنجاح',
                data: result.data
            });
        } else {
            res.status(400).json({
                status: false,
                message: 'فشل في استرداد المبلغ',
                error: result.error
            });
        }
    } catch (error) {
        res.status(500).json({
            status: false,
            message: 'حدث خطأ في الخادم',
            error: error.message
        });
    }
});

// شحن رصيد للمحفظة
router.post('/wallet/deposit', authenticateToken, async (req, res) => {
    try {
        const { amount, userId } = req.body;
        // const userId = req.user.id;

        if (!amount || amount <= 0) {
            return res.status(400).json({
                status: false,
                message: 'يجب تحديد مبلغ صحيح للشحن',
                code: 400,
                data: null
            });
        }

        const result = await tapService.createWalletDeposit(userId, amount);

        if (result.success) {
            res.json({
                status: true,
                message: 'تم إنشاء عملية شحن الرصيد بنجاح',
                code: 200,
                data: result.data
            });
        } else {
            res.status(400).json({
                status: false,
                message: 'فشل في إنشاء عملية شحن الرصيد',
                code: 400,
                error: result.error
            });
        }
    } catch (error) {
        res.status(500).json({
            status: false,
            message: 'حدث خطأ في الخادم',
            code: 500,
            error: error.message
        });
    }
});

// سحب رصيد من المحفظة
router.post('/wallet/withdraw', authenticateToken, async (req, res) => {
    try {
        const { amount, userId } = req.body;


        if (!amount || amount <= 0) {
            return res.status(400).json({
                status: false,
                message: 'يجب تحديد مبلغ صحيح للسحب',
                code: 400,
                data: null
            });
        }

        const result = await paypalService.createWorkerPayout(userId, amount);

        if (result.success) {
            res.json({
                status: true,
                message: 'تم إنشاء عملية سحب الرصيد بنجاح',
                code: 200,
                data: result.data
            });
        } else {
            res.status(400).json({
                status: false,
                message: 'فشل في إنشاء عملية سحب الرصيد',
                code: 400,
                error: result.error
            });
        }
    } catch (error) {
        res.status(500).json({
            status: false,
            message: 'حدث خطأ في الخادم',
            code: 500,
            error: error.message
        });
    }
});

// معالجة استجابة Tap
router.post('/wallet/callback', async (req, res) => {
    try {
        const { charge_id, status } = req.body;

        const result = await tapService.handlePaymentCallback(charge_id, status);

        if (result.success) {
            res.json({
                status: true,
                message: 'تم معالجة عملية الدفع بنجاح',
                code: 200,
                data: result.data
            });
        } else {
            res.status(400).json({
                status: false,
                message: 'فشل في معالجة عملية الدفع',
                code: 400,
                error: result.error
            });
        }
    } catch (error) {
        res.status(500).json({
            status: false,
            message: 'حدث خطأ في الخادم',
            code: 500,
            error: error.message
        });
    }
});

// إنشاء عملية سحب من Tap
router.post('/payout', authenticateToken, async (req, res) => {
    try {
        const { amount, bankDetails } = req.body;
        const userId = req.user.id;

        if (!amount || amount <= 0) {
            return res.status(400).json({
                status: false,
                message: 'يجب تحديد مبلغ صحيح للسحب',
                code: 400,
                data: null
            });
        }

        if (!bankDetails || !bankDetails.accountName || !bankDetails.accountNumber || !bankDetails.bankName || !bankDetails.bankCode) {
            return res.status(400).json({
                status: false,
                message: 'يجب تقديم جميع تفاصيل الحساب البنكي',
                code: 400,
                data: null
            });
        }

        const result = await tapService.createPayout(userId, amount, bankDetails);

        if (result.success) {
            res.json({
                status: true,
                message: 'تم إنشاء عملية السحب بنجاح',
                code: 200,
                data: result.data
            });
        } else {
            res.status(400).json({
                status: false,
                message: 'فشل في إنشاء عملية السحب',
                code: 400,
                error: result.error
            });
        }
    } catch (error) {
        res.status(500).json({
            status: false,
            message: 'حدث خطأ في الخادم',
            code: 500,
            error: error.message
        });
    }
});

// التحقق من حالة عملية السحب
router.get('/payout/:payoutId', authenticateToken, async (req, res) => {
    try {
        const result = await tapService.getPayoutStatus(req.params.payoutId);

        if (result.success) {
            res.json({
                status: true,
                message: 'تم استرجاع حالة عملية السحب بنجاح',
                code: 200,
                data: result.data
            });
        } else {
            res.status(400).json({
                status: false,
                message: 'فشل في استرجاع حالة عملية السحب',
                code: 400,
                error: result.error
            });
        }
    } catch (error) {
        res.status(500).json({
            status: false,
            message: 'حدث خطأ في الخادم',
            code: 500,
            error: error.message
        });
    }
});

// معالجة استجابة Tap لعملية السحب
router.post('/payout/callback', async (req, res) => {
    try {
        const { payout_id, status } = req.body;

        const result = await tapService.handlePayoutCallback(payout_id, status);

        if (result.success) {
            res.json({
                status: true,
                message: 'تم معالجة عملية السحب بنجاح',
                code: 200,
                data: result.data
            });
        } else {
            res.status(400).json({
                status: false,
                message: 'فشل في معالجة عملية السحب',
                code: 400,
                error: result.error
            });
        }
    } catch (error) {
        res.status(500).json({
            status: false,
            message: 'حدث خطأ في الخادم',
            code: 500,
            error: error.message
        });
    }
});

// إنشاء عملية سحب للعامل
router.post('/worker/payout', authenticateToken, async (req, res) => {
    try {
        const { amount, email } = req.body;
        const workerId = req.user.worker.id;

        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                error: 'المبلغ غير صالح'
            });
        }

        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'البريد الإلكتروني مطلوب'
            });
        }

        const result = await paypalService.createWorkerPayout(workerId, amount, email);

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.json({
            success: true,
            message: 'تم إنشاء عملية السحب بنجاح',
            data: result.data
        });
    } catch (error) {
        console.error('Error creating worker payout:', error);
        res.status(500).json({
            success: false,
            error: 'حدث خطأ أثناء إنشاء عملية السحب'
        });
    }
});

// التحقق من حالة سحب العامل
router.get('/worker/payout/:payoutId', authenticateToken, async (req, res) => {
    try {
        const { payoutId } = req.params;
        const result = await paypalService.getWorkerPayoutStatus(payoutId);

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.json({
            success: true,
            data: result.data
        });
    } catch (error) {
        console.error('Error checking payout status:', error);
        res.status(500).json({
            success: false,
            error: 'حدث خطأ أثناء التحقق من حالة السحب'
        });
    }
});

// معالجة استجابة PayPal لعملية سحب العامل
router.post('/worker/payout/callback', async (req, res) => {
    try {
        const result = await paypalService.handleWorkerPayoutCallback(req.body);

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.json({
            success: true,
            message: 'تم معالجة استجابة PayPal بنجاح',
            data: result.data
        });
    } catch (error) {
        console.error('Error handling PayPal callback:', error);
        res.status(500).json({
            success: false,
            error: 'حدث خطأ أثناء معالجة استجابة PayPal'
        });
    }
});

module.exports = router; 