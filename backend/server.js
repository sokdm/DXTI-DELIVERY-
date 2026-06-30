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

// ✅ FIXED: CORS allows all three deployed origins + localhost dev
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  process.env.ADMIN_URL || 'http://localhost:5174',
  'https://dxti-delivery.onrender.com',
  'https://dxti-delivery-admin-t68p.onrender.com',
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

// ✅ ADDED: Request logging for debugging
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

app.use(errorHandler);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

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
