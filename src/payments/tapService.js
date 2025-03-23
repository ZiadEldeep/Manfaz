const axios = require('axios');
const tapConfig = require('./tapConfig');
const prisma = require('../prismaClient');

class TapService {
    constructor() {
        this.axiosInstance = axios.create({
            baseURL: tapConfig.apiUrl,
            headers: {
                'Authorization': `Bearer ${tapConfig.secretKey}`,
                'Content-Type': 'application/json'
            }
        });
    }

    async createPayment(paymentData) {
        try {
            const response = await this.axiosInstance.post('/charges', {
                amount: paymentData.amount,
                currency: tapConfig.currency,
                description: paymentData.description,
                customer: {
                    first_name: paymentData.customerName,
                    email: paymentData.customerEmail,
                    phone: paymentData.customerPhone
                },
                source: {
                    id: paymentData.sourceId
                },
                redirect: {
                    url: paymentData.redirectUrl
                },
                reference: {
                    transaction: paymentData.transactionId,
                    order: paymentData.orderId
                }
            });

            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data || error.message
            };
        }
    }

    async retrievePayment(chargeId) {
        try {
            const response = await this.axiosInstance.get(`/charges/${chargeId}`);
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data || error.message
            };
        }
    }

    async refundPayment(chargeId, amount) {
        try {
            const response = await this.axiosInstance.post(`/charges/${chargeId}/refunds`, {
                amount: amount,
                currency: tapConfig.currency
            });
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data || error.message
            };
        }
    }

    async createWalletDeposit(userId, amount) {
        try {
            // إنشاء معاملة جديدة في قاعدة البيانات
            const transaction = await prisma.transaction.create({
                data: {
                    walletId: userId,
                    type: 'deposit',
                    amount: amount,
                    status: 'pending'
                }
            });

            // إنشاء عملية دفع في Tap
            const paymentData = {
                amount: amount,
                description: `شحن رصيد للمحفظة - ${transaction.id}`,
                customerName: 'عميل منفاز',
                customerEmail: 'customer@manfaz.com',
                customerPhone: '+966500000000',
                sourceId: 'src_all', // يمكن تغييره حسب طريقة الدفع المطلوبة
                redirectUrl: `${process.env.FRONTEND_URL}/wallet/callback?transactionId=${transaction.id}`,
                transactionId: transaction.id,
                orderId: `WALLET_${transaction.id}`
            };

            const result = await this.createPayment(paymentData);
            
            if (result.success) {
                // تحديث حالة المعاملة
                await prisma.transaction.update({
                    where: { id: transaction.id },
                    data: {
                        status: 'processing',
                        paymentId: result.data.id
                    }
                });

                return {
                    success: true,
                    data: {
                        transaction: transaction,
                        payment: result.data
                    }
                };
            } else {
                // تحديث حالة المعاملة في حالة الفشل
                await prisma.transaction.update({
                    where: { id: transaction.id },
                    data: { status: 'failed' }
                });

                return {
                    success: false,
                    error: result.error
                };
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async createWalletWithdrawal(userId, amount) {
        try {
            // التحقق من رصيد المحفظة
            const wallet = await prisma.wallet.findUnique({
                where: { userId }
            });

            if (!wallet || wallet.balance < amount) {
                return {
                    success: false,
                    error: 'رصيد المحفظة غير كافي'
                };
            }

            // إنشاء معاملة جديدة
            const transaction = await prisma.transaction.create({
                data: {
                    walletId: userId,
                    type: 'withdrawal',
                    amount: amount,
                    status: 'pending'
                }
            });

            // إنشاء عملية سحب في Tap
            const paymentData = {
                amount: amount,
                description: `سحب رصيد من المحفظة - ${transaction.id}`,
                customerName: 'عميل منفاز',
                customerEmail: 'customer@manfaz.com',
                customerPhone: '+966500000000',
                sourceId: 'src_all',
                redirectUrl: `${process.env.FRONTEND_URL}/wallet/callback?transactionId=${transaction.id}`,
                transactionId: transaction.id,
                orderId: `WITHDRAWAL_${transaction.id}`
            };

            const result = await this.createPayment(paymentData);
            
            if (result.success) {
                // تحديث حالة المعاملة
                await prisma.transaction.update({
                    where: { id: transaction.id },
                    data: {
                        status: 'processing',
                        paymentId: result.data.id
                    }
                });

                return {
                    success: true,
                    data: {
                        transaction: transaction,
                        payment: result.data
                    }
                };
            } else {
                // تحديث حالة المعاملة في حالة الفشل
                await prisma.transaction.update({
                    where: { id: transaction.id },
                    data: { status: 'failed' }
                });

                return {
                    success: false,
                    error: result.error
                };
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async handlePaymentCallback(chargeId, status) {
        try {
            // البحث عن المعاملة المرتبطة بعملية الدفع
            const transaction = await prisma.transaction.findFirst({
                where: { paymentId: chargeId }
            });

            if (!transaction) {
                return {
                    success: false,
                    error: 'لم يتم العثور على المعاملة'
                };
            }

            if (status === 'CAPTURED') {
                // تحديث حالة المعاملة
                await prisma.transaction.update({
                    where: { id: transaction.id },
                    data: { status: 'completed' }
                });

                // تحديث رصيد المحفظة
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
                } else if (transaction.type === 'withdrawal') {
                    await prisma.wallet.update({
                        where: { id: transaction.walletId },
                        data: {
                            balance: wallet.balance - transaction.amount
                        }
                    });
                }

                return {
                    success: true,
                    data: transaction
                };
            } else {
                // تحديث حالة المعاملة في حالة الفشل
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
            // التحقق من رصيد المحفظة
            const wallet = await prisma.wallet.findUnique({
                where: { userId }
            });

            if (!wallet || wallet.balance < amount) {
                return {
                    success: false,
                    error: 'رصيد المحفظة غير كافي'
                };
            }

            // إنشاء معاملة جديدة
            const transaction = await prisma.transaction.create({
                data: {
                    walletId: userId,
                    type: 'withdrawal',
                    amount: amount,
                    status: 'pending',
                    bankDetails: bankDetails // تخزين تفاصيل البنك
                }
            });

            // إنشاء عملية سحب في Tap
            const payoutData = {
                amount: amount,
                currency: tapConfig.currency,
                description: `سحب رصيد من المحفظة - ${transaction.id}`,
                beneficiary: {
                    name: bankDetails.accountName,
                    account_number: bankDetails.accountNumber,
                    bank_name: bankDetails.bankName,
                    bank_code: bankDetails.bankCode,
                    country: 'SA',
                    currency: tapConfig.currency
                },
                reference: {
                    transaction: transaction.id,
                    order: `WITHDRAWAL_${transaction.id}`
                }
            };

            const response = await this.axiosInstance.post('/payouts', payoutData);

            if (response.data) {
                // تحديث حالة المعاملة
                await prisma.transaction.update({
                    where: { id: transaction.id },
                    data: {
                        status: 'processing',
                        paymentId: response.data.id
                    }
                });

                return {
                    success: true,
                    data: {
                        transaction: transaction,
                        payout: response.data
                    }
                };
            } else {
                // تحديث حالة المعاملة في حالة الفشل
                await prisma.transaction.update({
                    where: { id: transaction.id },
                    data: { status: 'failed' }
                });

                return {
                    success: false,
                    error: 'فشل في إنشاء عملية السحب'
                };
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data || error.message
            };
        }
    }

    async getPayoutStatus(payoutId) {
        try {
            const response = await this.axiosInstance.get(`/payouts/${payoutId}`);
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data || error.message
            };
        }
    }

    async handlePayoutCallback(payoutId, status) {
        try {
            // البحث عن المعاملة المرتبطة بعملية السحب
            const transaction = await prisma.transaction.findFirst({
                where: { paymentId: payoutId }
            });

            if (!transaction) {
                return {
                    success: false,
                    error: 'لم يتم العثور على المعاملة'
                };
            }

            if (status === 'COMPLETED') {
                // تحديث حالة المعاملة
                await prisma.transaction.update({
                    where: { id: transaction.id },
                    data: { status: 'completed' }
                });

                // تحديث رصيد المحفظة
                const wallet = await prisma.wallet.findUnique({
                    where: { id: transaction.walletId }
                });

                await prisma.wallet.update({
                    where: { id: transaction.walletId },
                    data: {
                        balance: wallet.balance - transaction.amount
                    }
                });

                return {
                    success: true,
                    data: transaction
                };
            } else if (status === 'FAILED') {
                // تحديث حالة المعاملة في حالة الفشل
                await prisma.transaction.update({
                    where: { id: transaction.id },
                    data: { status: 'failed' }
                });

                return {
                    success: false,
                    error: 'فشلت عملية السحب'
                };
            }

            return {
                success: true,
                data: transaction
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // إنشاء عملية سحب للعامل
    async createWorkerPayout(workerId, amount, bankDetails) {
        try {
            // التحقق من وجود العامل
            const worker = await prisma.worker.findUnique({
                where: { id: workerId },
                include: {
                    user: true
                }
            });

            if (!worker) {
                return {
                    success: false,
                    error: 'العامل غير موجود'
                };
            }

            // التحقق من رصيد العامل
            const earnings = await prisma.earning.findMany({
                where: { workerId },
                select: { amount: true }
            });

            const totalEarnings = earnings.reduce((sum, earning) => sum + earning.amount, 0);
            const availableBalance = totalEarnings - worker.totalEarned;

            if (availableBalance < amount) {
                return {
                    success: false,
                    error: 'رصيدك غير كافٍ للسحب'
                };
            }

            // إنشاء معاملة السحب
            const payoutData = {
                amount: amount,
                currency: tapConfig.currency,
                description: `سحب رصيد للعامل ${worker.user.name}`,
                beneficiary: {
                    name: bankDetails.accountName,
                    account_number: bankDetails.accountNumber,
                    bank_name: bankDetails.bankName,
                    bank_code: bankDetails.bankCode
                },
                metadata: {
                    worker_id: workerId,
                    type: 'worker_payout'
                }
            };

            const response = await this.axiosInstance.post('/payouts', payoutData);

            // تحديث رصيد العامل
            await prisma.worker.update({
                where: { id: workerId },
                data: {
                    totalEarned: {
                        increment: amount
                    }
                }
            });

            // إنشاء سجل المعاملة
            await prisma.transaction.create({
                data: {
                    walletId: worker.user.Wallet[0].id,
                    type: 'withdrawal',
                    amount: amount,
                    status: 'processing',
                    metadata: {
                        payout_id: response.data.id,
                        type: 'worker_payout'
                    }
                }
            });

            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('Error creating worker payout:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'حدث خطأ أثناء إنشاء عملية السحب'
            };
        }
    }

    // التحقق من حالة سحب العامل
    async getWorkerPayoutStatus(payoutId) {
        try {
            const response = await this.axiosInstance.get(`/payouts/${payoutId}`);
            
            // تحديث حالة المعاملة في قاعدة البيانات
            const transaction = await prisma.transaction.findFirst({
                where: {
                    metadata: {
                        path: ['payout_id'],
                        equals: payoutId
                    }
                }
            });

            if (transaction) {
                await prisma.transaction.update({
                    where: { id: transaction.id },
                    data: {
                        status: response.data.status.toLowerCase()
                    }
                });
            }

            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'حدث خطأ أثناء التحقق من حالة السحب'
            };
        }
    }

    // معالجة استجابة Tap لعملية سحب العامل
    async handleWorkerPayoutCallback(payoutId, status) {
        try {
            const transaction = await prisma.transaction.findFirst({
                where: {
                    metadata: {
                        path: ['payout_id'],
                        equals: payoutId
                    }
                },
                include: {
                    wallet: true
                }
            });

            if (!transaction) {
                return {
                    success: false,
                    error: 'لم يتم العثور على المعاملة'
                };
            }

            // تحديث حالة المعاملة
            await prisma.transaction.update({
                where: { id: transaction.id },
                data: {
                    status: status.toLowerCase()
                }
            });

            // إذا كانت العملية ناجحة، تحديث رصيد المحفظة
            if (status === 'COMPLETED') {
                await prisma.wallet.update({
                    where: { id: transaction.walletId },
                    data: {
                        balance: {
                            decrement: transaction.amount
                        }
                    }
                });
            }

            return {
                success: true,
                data: transaction
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = new TapService(); 