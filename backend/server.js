const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth');
const packageRoutes = require('./routes/packages');

connectDB();

const app = express();

app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  process.env.ADMIN_URL || 'http://localhost:5174',
  'https://dxti-delivery.onrender.com',
  'https://dxti-delivery-admin-t68p.onrender.com',
  'https://dxti-delivery-unhl.onrender.com',
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.log('❌ CORS blocked:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} | ${req.method} ${req.path} | Origin: ${req.headers.origin || 'none'} | Auth: ${req.headers.authorization ? 'YES' : 'NO'}`);
  next();
});

app.use('/api/admin', authRoutes);
app.use('/api/packages', packageRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'DXTI Delivery API is running',
    timestamp: new Date().toISOString(),
  });
});

// DEBUG ENDPOINTS
app.get('/api/debug/env', (req, res) => {
  res.json({
    cloudinary_name_set: !!process.env.CLOUDINARY_CLOUD_NAME,
    cloudinary_key_set: !!process.env.CLOUDINARY_API_KEY,
    cloudinary_secret_set: !!process.env.CLOUDINARY_API_SECRET,
    mongodb_set: !!process.env.MONGODB_URI,
    jwt_set: !!process.env.JWT_SECRET,
    frontend_url: process.env.FRONTEND_URL,
    admin_url: process.env.ADMIN_URL,
    brevo_key_set: !!process.env.BREVO_API_KEY,
    brevo_key_length: process.env.BREVO_API_KEY ? process.env.BREVO_API_KEY.length : 0,
    email_from: process.env.EMAIL_FROM,
  });
});

app.post('/api/debug/create-package', async (req, res) => {
  try {
    console.log('🔍 DEBUG: Testing package creation without auth/upload/email');
    const Package = require('./models/Package');

    const testPackage = await Package.create({
      packageName: 'TEST PACKAGE',
      packageDescription: 'Debug test',
      packageWeight: 1.0,
      packageImage: 'https://via.placeholder.com/150',
      senderName: 'Test Sender',
      senderPhone: '1234567890',
      senderEmail: 'test@test.com',
      senderAddress: 'Test Address',
      senderCountry: 'Test Country',
      senderCity: 'Test City',
      receiverName: 'Test Receiver',
      receiverPhone: '0987654321',
      receiverEmail: 'receiver@test.com',
      receiverAddress: 'Receiver Address',
      receiverCountry: 'Receiver Country',
      receiverCity: 'Receiver City',
      receiverGender: 'male',
      deliveryPrice: 10.00,
      currentLocation: { lat: 0, lng: 0, locationName: 'Test Current' },
      destinationLocation: { lat: 1, lng: 1, locationName: 'Test Dest' },
      status: 'pending',
    });

    res.json({ success: true, trackingCode: testPackage.trackingCode });
  } catch (err) {
    console.error('DEBUG ERROR:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DEBUG: Test email endpoint
app.post('/api/debug/test-email', async (req, res) => {
  try {
    const { sendShipmentCreatedEmail } = require('./utils/emailService');
    const testPkg = {
      trackingCode: 'DXT-TEST123',
      receiverName: 'Test User',
      receiverEmail: req.body.email || 'wsdmpresh@gmail.com',
      receiverGender: 'male',
      senderName: 'Test Sender',
      senderCountry: 'USA',
      deliveryPrice: 99.99,
    };
    
    console.log('🔍 DEBUG: Testing Brevo email to', testPkg.receiverEmail);
    await sendShipmentCreatedEmail(testPkg);
    res.json({ success: true, message: 'Email API call completed (check logs + inbox)' });
  } catch (err) {
    console.error('DEBUG EMAIL ERROR:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message, 
      details: err.response?.data || 'No response data' 
    });
  }
});

// 404 handler — MUST be last
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 DXTI Delivery Server running on port ${PORT}`);
  console.log(`📦 API URL: http://localhost:${PORT}/api`);
  console.log(`🌐 Allowed origins:`, allowedOrigins);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  process.exit(1);
});
