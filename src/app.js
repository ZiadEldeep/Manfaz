const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// Import Routes
const userRoutes = require('./routes/userRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const authRoutes = require('./routes/authRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const orderRoutes = require('./routes/orderRoutes');
const workerRoutes = require('./routes/workerRoutes');
const deliveryDriverRoutes = require('./routes/deliveryDriverRoutes');
const serviceParameterRoutes = require('./routes/serviceParameterRoutes');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/categories', categoryRoutes);
app.use('/services', serviceRoutes);
app.use('/workers', workerRoutes);
app.use('/delivery-drivers', deliveryDriverRoutes);
app.use('/orders', orderRoutes);
app.use('/service-parameters', serviceParameterRoutes);

// Start Server
const PORT = process.env.PORT || 3003;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
