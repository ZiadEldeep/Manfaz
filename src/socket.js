const prisma = require('./prismaClient');
const translate = require('translate-google');

// تخزين اتصالات المستخدمين
const connectedUsers = new Map();
const connectedWorkers = new Map();
const connectedStores = new Map();
const connectedAdmins = new Map();

const initializeSocket = (io) => {
  // تخزين معلومات المستخدمين المتصلين
  const connectedUsers = new Map();

  io.on('connection', (socket) => {
    console.log('New client connected');

    // تسجيل المستخدم في الغرفة المناسبة
    socket.on('register', ({ type, id }) => {
      if (!id) return;

      // إزالة المستخدم من الغرف السابقة
      socket.rooms.forEach((room) => {
        if (room !== socket.id) {
          socket.leave(room);
        }
      });

      // إضافة المستخدم للغرفة المناسبة
      switch (type) {
        case 'user':
          socket.join(`user_${id}`);
          break;
        case 'worker':
          socket.join(`worker_${id}`);
          break;
        case 'store':
          socket.join(`store_${id}`);
          break;
        case 'admin':
          socket.join('admin');
          break;
      }

      connectedUsers.set(socket.id, { type, id });
      console.log(`${type} ${id} registered`);
    });

    // معالجة تحديثات الموقع
    socket.on('updateLocation', async (data) => {
      const user = connectedUsers.get(socket.id);
      if (!user) return;

      // إرسال تحديث الموقع للأطراف المعنية
      if (user.type === 'worker') {
        io.to('admin').emit('workerLocationUpdated', {
          workerId: user.id,
          location: data.location
        });
      } else if (user.type === 'user') {
        // إرسال موقع المستخدم للعامل المخصص له (إذا وجد)
        if (data.workerId) {
          io.to(`worker_${data.workerId}`).emit('customerLocationUpdated', {
            userId: user.id,
            location: data.location
          });
        }
      }
    });

    // معالجة تحديثات حالة العامل
    socket.on('updateWorkerStatus', async (data) => {
      const user = connectedUsers.get(socket.id);
      if (!user || user.type !== 'worker') return;

      io.to('admin').emit('workerStatusUpdated', {
        workerId: user.id,
        status: data.status
      });
    });

    // معالجة تحديثات حالة المتجر
    socket.on('updateStoreStatus', async (data) => {
      const user = connectedUsers.get(socket.id);
      if (!user || user.type !== 'store') return;

      io.to('admin').emit('storeStatusUpdated', {
        storeId: user.id,
        status: data.status
      });
    });

    // معالجة الإشعارات العامة
    socket.on('notification', (data) => {
      if (data.to) {
        // إرسال إشعار لمستخدم محدد
        io.to(`${data.to.type}_${data.to.id}`).emit('notification', {
          title: data.title,
          message: data.message,
          type: data.notificationType
        });
      } else {
        // إرسال إشعار عام
        io.emit('notification', {
          title: data.title,
          message: data.message,
          type: data.notificationType
        });
      }
    });

    // معالجة تحديثات الطلبات
    socket.on('orderUpdate', (data) => {
      const { orderId, status, updatedBy } = data;
      
      // إرسال التحديث للأطراف المعنية
      if (data.userId) {
        io.to(`user_${data.userId}`).emit('orderUpdated', data);
      }
      if (data.workerId) {
        io.to(`worker_${data.workerId}`).emit('orderUpdated', data);
      }
      if (data.storeId) {
        io.to(`store_${data.storeId}`).emit('orderUpdated', data);
      }
      
      // إرسال التحديث للوحة التحكم
      io.to('admin').emit('orderUpdated', data);
    });

    // معالجة الرسائل المباشرة
    socket.on('directMessage', (data) => {
      const { to, message } = data;
      io.to(`${to.type}_${to.id}`).emit('directMessage', {
        from: connectedUsers.get(socket.id),
        message
      });
    });

    // معالجة تحديثات لوحة التحكم
    socket.on('dashboardUpdate', (data) => {
      io.to('admin').emit('dashboardUpdated', data);
    });

    // معالجة قطع الاتصال
    socket.on('disconnect', () => {
      const user = connectedUsers.get(socket.id);
      if (user) {
        // إعلام الأطراف المعنية بقطع الاتصال
        if (user.type === 'worker') {
          io.to('admin').emit('workerDisconnected', { workerId: user.id });
        } else if (user.type === 'store') {
          io.to('admin').emit('storeDisconnected', { storeId: user.id });
        }
        
        connectedUsers.delete(socket.id);
      }
      console.log('Client disconnected');
    });
  });
};

module.exports = initializeSocket; 