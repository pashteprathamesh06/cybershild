const dns = require('dns');
dns.setServers(['8.8.8.8']);



require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const analyzeRoutes = require('./routes/analyzeRoutes');
const compareRoutes = require('./routes/compareRoutes');
const scanRoutes = require('./routes/scanRoutes');
const simulatorRoutes = require('./routes/simulatorRoutes');
const learningRoutes = require('./routes/learningRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();


// --- Security & core middleware ---
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// --- Rate limiting ---
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api', apiLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many auth attempts, please try again later.' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many analysis requests, please slow down.' },
});
app.use('/api/analyze', aiLimiter);
app.use('/api/compare', aiLimiter);

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/analyze', analyzeRoutes);
app.use('/api/compare', compareRoutes);
app.use('/api/scans', scanRoutes);
app.use('/api/simulator', simulatorRoutes);
app.use('/api/learning', learningRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'CyberShield AI API is running', timestamp: new Date().toISOString() });
});

// --- Serve frontend static files ---
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

app.get('*', (req, res, next) => {
  if (req.originalUrl.startsWith('/api')) return next();
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// --- Error handling (must be last) ---
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 CyberShield AI server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

module.exports = app;