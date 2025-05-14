const axios = require('axios');
const paymobConfig = require('./paymobConfig');
const prisma = require('../prismaClient');
const translate = require('../translate');

class PaymobService {
    constructor() {
        this.axiosInstance = axios.create({
            baseURL: paymobConfig.baseUrl,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    // الخطوة 1: المصادقة
    async authenticate() {
        try {
            const response = await this.axiosInstance.post('/auth/tokens', {
                api_key: paymobConfig.apiKey
            });

            if (!response.data || !response.data.token) {
                throw new Error('فشل في الحصول على رمز المصادقة');
            }

            return response.data.token;
        } catch (error) {
            console.error('خطأ في المصادقة:', error.response?.data || error.message);
            throw error;
        }
    }

    // الخطوة 2: إنشاء الطلب
    async createOrder(token, amount, currency = paymobConfig.currency, items = []) {
        try {
            const response = await this.axiosInstance.post('/ecommerce/orders', {
                auth_token: token,
                delivery_needed: "false",
                amount_cents: amount * 100,
                currency: currency,
                items,
                merchant_order_ext_ref: 'order' + Date.now()
            });

            if (response.status === 201) {
                return response.data;
            } else {
                console.error('فشل في إنشاء طلب الدفع:', response.data);
                throw new Error('فشل في إنشاء طلب الدفع');
            }
        } catch (error) {
            console.error('خطأ في إنشاء الطلب:', error.response?.data || error.message);
            throw error;
        }
    }

    // الخطوة 3: إنشاء مفتاح الدفع
    async generatePaymentKey(token, orderId, amount, currency, billingData) {
        try {
            const response = await this.axiosInstance.post('/acceptance/payment_keys', {
                auth_token: token,
                amount_cents: amount * 100,
                expiration: 3600,
                order_id: orderId,
                billing_data: billingData,
                currency,
                integration_id: paymobConfig.integrationId
            });

            if (!response.data || !response.data.token) {
                throw new Error('فشل في إنشاء مفتاح الدفع');
            }

            return response.data.token;
        } catch (error) {
            console.error('خطأ في إنشاء مفتاح الدفع:', error.response?.data || error.message);
            throw error;
        }
    }

    // الخطوة 4: إنشاء رابط الدفع
    getPaymentLink(paymentToken) {
        if (!paymentToken) {
            throw new Error('رمز الدفع غير صالح');
        }
        return `${paymobConfig.baseUrl}/acceptance/iframes/${paymobConfig.iframeId}?payment_token=${paymentToken}`;
    }

    async createWalletDeposit(userId, amount) {
        try {
            // التحقق من صحة المبلغ
            if (!amount || amount <= 0) {
                return {
                    success: false,
                    error: 'يجب تحديد مبلغ صحيح أكبر من صفر'
                };
            }

            // البحث عن المستخدم
            const user = await prisma.user.findUnique({
                where: { id: userId }
            });

            if (!user) {
                return {
                    success: false,
                    error: 'المستخدم غير موجود'
                };
            }

            // البحث عن المحفظة
            let wallet = await prisma.wallet.findFirst({
                where: {
                    userId: user.id
                }
            });

            if (!wallet) {
                return {
                    success: false,
                    error: 'المستخدم ليس لديه محفظة'
                };
            }

            // إنشاء معاملة جديدة
            const transaction = await prisma.transaction.create({
                data: {
                    walletId: wallet.id,
                    type: 'deposit',
                    amount: amount,
                    status: 'pending'
                }
            });

            if (!transaction) {
                return {
                    success: false,
                    error: 'فشل في إنشاء المعاملة'
                };
            }

            // الخطوة 1: المصادقة
            const token = await this.authenticate();

            // الخطوة 2: إنشاء الطلب
            const order = await this.createOrder(token, amount, paymobConfig.currency, []);

            // الخطوة 3: إنشاء مفتاح الدفع
            const billingData = {
                first_name: user.name || 'عميل',
                last_name: user.name || 'منفذ',
                email: user.email,
                phone_number: user.phone || '0000000000',
                apartment: "NA",
                floor: "NA",
                street: "NA",
                building: "NA",
                shipping_method: "NA",
                postal_code: "NA",
                city: "NA",
                country: "NA",
                state: "NA"
            };

            const paymentKey = await this.generatePaymentKey(
                token,
                order.id,
                amount,
                paymobConfig.currency,
                billingData
            );

            // تحديث المعاملة
            await prisma.transaction.update({
                where: { id: transaction.id },
                data: {
                    status: 'processing',
                    paymentId: `${order.id}`
                }
            });

            // الخطوة 4: إنشاء رابط الدفع
            const paymentLink = this.getPaymentLink(paymentKey);

            return {
                success: true,
                data: {
                    transaction: {
                        id: transaction.id,
                        amount: transaction.amount,
                        status: transaction.status,
                        createdAt: transaction.createdAt
                    },
                    payment: {
                        paymentLink,
                        orderId: order.id,
                        paymentToken: paymentKey
                    }
                }
            };
        } catch (error) {
            console.error('خطأ في إنشاء إيداع المحفظة:', error);

            if (error.transactionId) {
                await prisma.transaction.update({
                    where: { id: error.transactionId },
                    data: { status: 'failed' }
                });
            }

            return {
                success: false,
                error: error.message || 'حدث خطأ أثناء إنشاء عملية الإيداع'
            };
        }
    }

    async handlePaymentCallback(transactionId, status) {
        try {
            const transaction = await prisma.transaction.findFirst({
                where: { paymentId: transactionId }
            });

            if (!transaction) {
                return {
                    success: false,
                    error: 'لم يتم العثور على المعاملة'
                };
            }

            if (status === 'success') {
                await prisma.transaction.update({
                    where: { id: transaction.id },
                    data: { status: 'completed' }
                });

                const wallet = await prisma.wallet.findUnique({
                    where: { id: transaction.walletId }
                });

                if (transaction.type === 'deposit') {
                    await prisma.wallet.update({
                        where: { id: transaction.walletId },
                        data: {
                            balance: wallet.balance + transaction.amount
                        }
                    });
                }

                return {
                    success: true,
                    data: transaction
                };
            } else {
                await prisma.transaction.update({
                    where: { id: transaction.id },
                    data: { status: 'failed' }
                });

                return {
                    success: false,
                    error: 'فشلت عملية الدفع'
                };
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async createPayout(userId, amount, bankDetails) {
        try {
            const wallet = await prisma.wallet.findUnique({
                where: { userId }
            });

            if (!wallet || wallet.balance < amount) {
                return {
                    success: false,
                    error: 'رصيد المحفظة غير كافي'
                };
            }

            const transaction = await prisma.transaction.create({
                data: {
                    walletId: userId,
                    type: 'withdrawal',
                    amount: amount,
                    status: 'pending',
                    bankDetails: bankDetails
                }
            });

            // هنا يمكن إضافة منطق السحب من خلال Paymob
            // لاحظ أن Paymob لا يدعم عمليات السحب المباشرة
            // يمكن استخدام خدمة أخرى للسحب أو التعامل مع البنوك مباشرة

            return {
                success: true,
                data: {
                    transaction: transaction,
                    message: 'تم إنشاء طلب السحب بنجاح'
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = new PaymobService(); 