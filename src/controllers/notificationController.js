const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const translate = require('../translate');

// دالة إنشاء إشعار جديد
const createNotification = async (req, res) => {
    
    try {
        let lang = req.headers.lang || 'en';
        const { title, message, type, relatedId, orderId,senderId } = req.body;

        // التحقق من صحة البيانات
        if (!title || !message || !type || !relatedId || !orderId || !senderId) {
            return res.status(400).json({
                status: false,
                message: 'جميع الحقول مطلوبة',
                code: 400,
                data: null
            });
        }

        // التحقق من صحة النوع
        if (!['user', 'employee', 'worker'].includes(type)) {
            return res.status(400).json({
                status: false,
                message: 'نوع الإشعار غير صالح',
                code: 400,
                data: null
            });
        }
        let user = await prisma.user.findUnique({
            where: {
                id: relatedId
            }
        })  
        if (!user) {
            return res.status(404).json({
                status: false,
                message: 'المستخدم غير موجود',
                code: 404,
                data: null
            });
        }
        // إنشاء الإشعار في قاعدة البيانات
        const notification = await prisma.notification.create({
            data: {
                title,
                message,
                type,
                relatedId:user.id,
                orderId,
                senderId,
                isRead: false
            },
            include: {
                sender: {
                  select: {
                    id: true,
                    name: true,
                    imageUrl: true
                  }
                },
                order:{
                  select:{
                    service:{
                      select:{
                        name:true
                      }
                    }
                  }
                }
              }
        });

        // إرسال الإشعار عبر Socket.IO
        const room = `${type}_${relatedId}`;
        if (req.io) {
            req.io.to(room).emit('newNotification', notification);
        }else{
            console.log('Socket.IO not connected');
        }

        return res.status(201).json({
            status: true,
            message: 'تم إنشاء الإشعار بنجاح',
            code: 201,
            data: notification
        });
    } catch (error) {
        console.error('Error creating notification:', error);
        return res.status(500).json({
            status: false,
            message: 'حدث خطأ أثناء إنشاء الإشعار',
            code: 500,
            data: null
        });
    }
};

// دالة جلب إشعارات مستخدم معين
const getNotifications = async (req, res) => {
    let lang = req.query.lang || 'en';
    let limit = req.query.limit || 10;
    let page = req.query.page || 1;
    let skip = (+page - 1) * +limit;
    try {
        const { type, id } = req.params;

        // التحقق من صحة النوع
        if (!['user', 'employee', 'worker'].includes(type)) {
            let message = await translate('نوع الإشعار غير صالح', { to: lang });
            return res.status(400).json({
                status: false,
                message: message,
                code: 400,
                data: null
            });
        }
        let [notifications, count,message] = await Promise.all([
            prisma.notification.findMany({
                where: {
                    type,
                relatedId: id
            },
            include:{
                sender:{
                    select:{
                        id:true,
                        name:true,
                        imageUrl:true
                    }
                },
                order:{
                    select:{
                        id:true,
                        service:{
                            select:{
                                name:true
                            }
                        }
                    },
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            skip,
            take: +limit
        }),
        prisma.notification.count({
            where: {
                type,
                relatedId: id
            }
        }),
        translate('تم جلب الإشعارات بنجاح', { to: lang })
        ]);
        let translateNotifications=await Promise.all(notifications.map(async (notification) => {
            let [title,message,serviceName] = await Promise.all([
                translate(notification.title, { to: lang }),
                translate(notification.message, { to: lang }),
                translate(notification.order?.service?.name||'', { to: lang })
            ]);
            return {
                ...notification,
                title,
                message,
                ...(notification.order?{order:{...notification.order,service:{...notification.service,name:serviceName}}}:{})
            }
        }));
        const isNext = count > +page * +limit + notifications.length; 
        return res.status(200).json({
            status: true,
            message: message,
            code: 200,
            data: {
                notifications:translateNotifications,
                count, hasMore: isNext, nextPage: +page + 1
            }
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        let message = await translate('حدث خطأ أثناء جلب الإشعارات', { to: lang });
        return res.status(500).json({
            status: false,
            message:message+error,
            code: 500,
            data: null
        });
    }
};

// دالة تحديث حالة الإشعار كمقروء
const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;

        const notification = await prisma.notification.update({
            where: { id },
            data: { isRead: true }
        });

        return res.status(200).json({
            status: true,
            message: 'تم تحديث حالة الإشعار بنجاح',
            code: 200,
            data: notification
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        return res.status(500).json({
            status: false,
            message: 'حدث خطأ أثناء تحديث حالة الإشعار',
            code: 500,
            data: null
        });
    }
};

// دالة حذف إشعار
const deleteNotification = async (req, res) => {
    const lang = req.query.lang || 'en';
    try {
        const { id } = req.params;

        await prisma.notification.delete({
            where: { id }
        });
let message=await translate('تم حذف الإشعار بنجاح', { to: lang })
        return res.status(200).json({
            status: true,
            message: message,
            code: 200,
            data: null
        });
    } catch (error) {
        console.error('Error deleting notification:', error);
        let message=await translate('حدث خطأ أثناء حذف الإشعار', { to: lang })
        return res.status(500).json({
            status: false,
            message: message,
            code: 500,
            data: null
        });
    }
};

module.exports = {
    createNotification,
    getNotifications,
    markAsRead,
    deleteNotification
}; 