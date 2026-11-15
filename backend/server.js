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
const integrationRoutes = require('./routes/integrations');
const adminIntegrationRoutes = require('./routes/adminIntegrations');
const { startWebhookWorker } = require('./utils/webhookDelivery');

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
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Idempotency-Key',
    'X-Credixa-Payment-Timestamp',
    'X-Credixa-Payment-Nonce',
    'X-Credixa-Payment-Signature',
  ],
}));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} | ${req.method} ${req.path} | Origin: ${req.headers.origin || 'none'} | Auth: ${req.headers.authorization ? 'YES' : 'NO'}`);
  next();
});

app.use('/api/admin', authRoutes);
app.use('/api/admin/integrations', adminIntegrationRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/v1/integrations', integrationRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'TRX Logistics API is running',
    timestamp: new Date().toISOString(),
  });
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
  console.log(`TRX Logistics Server running on port ${PORT}`);
  console.log(`📦 API URL: http://localhost:${PORT}/api`);
  console.log(`🌐 Allowed origins:`, allowedOrigins);
  startWebhookWorker();
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  process.exit(1);
});
