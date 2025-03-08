const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// Import Routes
const userRoutes = require('./routes/userRoutes');
const authAdminController = require('./routes/authAdminRoutes.js');
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
const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors({credentials: true, origin: "*"}));

// Routes
app.use('/auth', authRoutes);
app.use('/auth-admin', authAdminController);
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
app.use('/user-locations', userLocationRoutes);
app.use('/employees', employeeRoutes);
app.use('/employees-activities', employeeActivitiesRoutes);
app.use("/dashboard", dashboardRoutes);

// Start Server
const PORT = process.env.PORT || 3003;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
