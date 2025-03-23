const paypal = require('@paypal/checkout-server-sdk');
const paypalConfig = require('./paypalConfig');
const prisma = require('../prismaClient');

class PayPalService {
    constructor() {
        const environment = paypalConfig.mode === 'live'
            ? new paypal.core.LiveEnvironment(paypalConfig.clientId, paypalConfig.clientSecret)
            : new paypal.core.SandboxEnvironment(paypalConfig.clientId, paypalConfig.clientSecret);
        
        this.client = new paypal.core.PayPalHttpClient(environment);
    }

    // إنشاء عملية سحب للعامل
    async createWorkerPayout(workerId, amount, email) {
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
                sender_batch_header: {
                    sender_batch_id: `BATCH_${Date.now()}`,
                    email_subject: "تم سحب رصيدك من منفاز",
                    email_message: "تم إرسال رصيدك بنجاح"
                },
                items: [{
                    recipient_type: "EMAIL",
                    amount: {
                        value: amount.toString(),
                        currency: paypalConfig.currency
                    },
                    receiver: email,
                    note: `سحب رصيد للعامل ${worker.user.name}`,
                    sender_item_id: `ITEM_${Date.now()}`
                }]
            };

            const request = new paypal.payouts.PayoutsPostRequest();
            request.requestBody(payoutData);

            const response = await this.client.execute(request);

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
                        payout_id: response.result.batch_header.payout_batch_id,
                        type: 'worker_payout',
                        paypal_batch_id: response.result.batch_header.payout_batch_id
                    }
                }
            });

            return {
                success: true,
                data: response.result
            };
        } catch (error) {
            console.error('Error creating worker payout:', error);
            return {
                success: false,
                error: error.message || 'حدث خطأ أثناء إنشاء عملية السحب'
            };
        }
    }

    // التحقق من حالة سحب العامل
    async getWorkerPayoutStatus(payoutId) {
        try {
            const request = new paypal.payouts.PayoutsGetRequest(payoutId);
            const response = await this.client.execute(request);
            
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
                        status: response.result.batch_header.batch_status.toLowerCase()
                    }
                });
            }

            return {
                success: true,
                data: response.result
            };
        } catch (error) {
            return {
                success: false,
                error: error.message || 'حدث خطأ أثناء التحقق من حالة السحب'
            };
        }
    }

    // معالجة استجابة PayPal لعملية سحب العامل
    async handleWorkerPayoutCallback(event) {
        try {
            if (event.event_type !== 'PAYMENT.PAYOUTSBATCH.SUCCESS') {
                return {
                    success: false,
                    error: 'نوع الحدث غير مدعوم'
                };
            }

            const payoutId = event.resource.payout_batch_id;
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
                    status: 'completed'
                }
            });

            // تحديث رصيد المحفظة
            await prisma.wallet.update({
                where: { id: transaction.walletId },
                data: {
                    balance: {
                        decrement: transaction.amount
                    }
                }
            });

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

module.exports = new PayPalService(); 