'use strict';

require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');

const connectDB = require('./config/db');
const logger = require('./utils/logger');
const { apiLimiter } = require('./middleware/rateLimiter');
const errorMiddleware = require('./middleware/errorMiddleware');

// Route imports
const authRoutes = require('./routes/authRoutes');
const customerRoutes = require('./routes/customerRoutes');
const loanRoutes = require('./routes/loanRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const exportRoutes = require('./routes/exportRoutes');
const publicRoutes = require('./routes/publicRoutes');

const app = express();

// ─── Security Middlewares ────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── Body Parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Cookie Parser ───────────────────────────────────────────────────────────
app.use(cookieParser(process.env.COOKIE_SECRET));

// ─── HTTP Request Logging ────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(
    morgan('combined', {
      stream: {
        write: (message) => logger.http(message.trim()),
      },
    })
  );
}

// ─── General Rate Limit ──────────────────────────────────────────────────────
app.use('/api', apiLimiter);

// ─── Input Sanitization ──────────────────────────────────────────────────────
app.use(
  mongoSanitize({
    replaceWith: '_',
  })
);
app.use(xss());

// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'CPAY API is running.',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ──────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/public', publicRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: [${req.method}] ${req.originalUrl}`,
  });
});

// ─── Centralized Error Middleware ─────────────────────────────────────────────
app.use(errorMiddleware);

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    logger.info(`🚀  CPAY backend running on port ${PORT} [${process.env.NODE_ENV}]`);
    logger.info(`    Health: http://localhost:${PORT}/health`);
  });

  // Graceful shutdown
  const gracefulShutdown = (signal) => {
    logger.info(`\n${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      const mongoose = require('mongoose');
      await mongoose.disconnect();
      logger.info('MongoDB disconnected. Server closed.');
      process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after 10s timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  process.on('unhandledRejection', (err) => {
    logger.error(`Unhandled Promise Rejection: ${err.message}`);
    gracefulShutdown('unhandledRejection');
  });
};

startServer();

module.exports = app; // for testing
