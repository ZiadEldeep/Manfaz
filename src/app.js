const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { createServer } = require('http');
const { Server } = require('socket.io');
const initializeSocket = require('./socket');

// Import Routes
const userRoutes = require('./routes/userRoutes');
const authAdminRoutes = require('./routes/authAdminRoutes.js');
const categoryRoutes = require('./routes/categoryRoutes');
const authRoutes = require('./routes/authRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const orderRoutes = require('./routes/orderRoutes');
const workerRoutes = require('./routes/workerRoutes');
const deliveryDriverRoutes = require('./routes/deliveryDriverRoutes');
const serviceParameterRoutes = require('./routes/serviceParameterRoutes');
const storeRoutes = require('./routes/storeRoutes');
const rewardRoutes = require('./routes/rewardRoutes');
const storeWorkingHoursRoutes = require('./routes/storeWorkingHoursRoutes');
const userLocationRoutes = require('./routes/userLocationRoutes');
const employeeRoutes = require('./routes/employeeRoutes.js');
const employeeActivitiesRoutes = require('./routes/employeeActivitiesRoutes.js');
const dashboardRoutes = require('./routes/dashboardRoutes.js');
const notificationRoutes = require('./routes/notificationRoutes.js');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:3000', "https://manfaz.vercel.app", "https://manfaz-dashboard.vercel.app"],
    methods: ["GET", "POST", "PUT", "DELETE","PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  }
});

// تهيئة Socket.IO
initializeSocket(io);

// Middleware
app.use(cors({
    origin: ['http://localhost:3000',"https://manfaz.vercel.app","https://manfaz-dashboard.vercel.app"], // Allow requests from this origin
    methods: ['GET', 'POST', 'PUT', 'DELETE',"PATCH"], // Specify allowed methods
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.use((req, res, next) => {
  req.io = io;
  next();
});


// app.use((req, res, next) => {
//     res.header("Access-Control-Allow-Origin", ['http://localhost:3000',"https://manfaz.vercel.app","https://manfaz-dashboard.vercel.app"]); 
//     res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
//     res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
//     res.header("Access-Control-Allow-Credentials", "true");
//     next();
// });
// Routes
app.use('/auth', authRoutes);
app.use('/auth-admin', authAdminRoutes);
app.use('/users', userRoutes);
app.use('/categories', categoryRoutes);
app.use('/services', serviceRoutes);
app.use('/workers', workerRoutes);
app.use('/delivery-drivers', deliveryDriverRoutes);
app.use('/orders', orderRoutes);
app.use('/service-parameters', serviceParameterRoutes);
app.use('/stores', storeRoutes);
app.use('/rewards', rewardRoutes);
app.use('/store-working-hours', storeWorkingHoursRoutes);
app.use('/locations', userLocationRoutes);
app.use('/employees', employeeRoutes);
app.use('/employees-activities', employeeActivitiesRoutes);
app.use("/dashboard", dashboardRoutes);
app.use('/notifications', notificationRoutes);

// معالجة الأخطاء
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: false,
    message: 'حدث خطأ في الخادم',
    code: 500,
    data: null
  });
});

// معالجة المسارات غير الموجودة
app.use((req, res) => {
  res.status(404).json({
    status: false,
    message: 'المسار غير موجود',
    code: 404,
    data: null
  });
});

const PORT = process.env.PORT || 3003;

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
