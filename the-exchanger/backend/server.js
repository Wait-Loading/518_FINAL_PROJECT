
// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const connectDB = require('./db'); // default export function from db.js

// Routers
const authRoutes = require('./routes/auth');
const listingsRoutes = require('./routes/listings');
const tradeOfferRoutes = require('./routes/offers');
const uploadsRoutes = require('./routes/uploads');

const app = express();

/* ---------------------------- Safety handlers --------------------------- */
process.on('unhandledRejection', (reason) => {
  console.error('⚠️  Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('⚠️  Uncaught Exception:', err);
});

/* ----------------------------- Middleware ------------------------------ */
app.set('trust proxy', 1);
app.use(express.json({ limit: '10mb' }));
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(morgan('dev'));

/* ------------------------ Path normalization (rewrite) ------------------ */
/**
 * Normalize common path mistakes before routing:
 * - Collapse multiple slashes
 * - Rewrite `/api/api/...` -> `/api/...`
 */
app.use((req, _res, next) => {
  const original = req.url;
  // collapse multiple slashes except protocol part (not present here)
  let normalized = original.replace(/\/{2,}/g, '/');
  // fix double /api prefixes
  normalized = normalized.replace(/^\/api\/api\//, '/api/');
  if (normalized !== original) {
    // Update both req.url and req.path for downstream middleware
    req.url = normalized;
    req.path = normalized.split('?')[0];
    // Optional: log once while testing
    // console.log('🔧 normalized path:', original, '->', normalized);
  }
  next();
});

/* --------------------------- Static: uploads ---------------------------- */
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// Serve uploads at BOTH paths so old/new clients work
app.use('/api/uploads', express.static(UPLOADS_DIR));
app.use('/uploads', express.static(UPLOADS_DIR));

/* ----------------------------- Health check ---------------------------- */
app.get('/api/health', (_req, res) => {
  res.json({ message: 'Server is running!', timestamp: new Date() });
});

/* -------------------------------- Routes -------------------------------- */
// Auth: /api/auth/*
app.use('/api/auth', authRoutes);

// Listings: /api/listings, /api/listings/:id, etc.
app.use('/api', listingsRoutes);

// Trade offers: /api/trade-offers/*
app.use('/api/trade-offers', tradeOfferRoutes);

// Uploads API (multer handlers): /api/uploads/listing-images
// ✅ Mount uploads router under /api/uploads (NOT /uploads)
app.use('/api/uploads', uploadsRoutes);

/* -------------------------- 404 & Error handlers ------------------------ */
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found', path: req.originalUrl });
});

app.use((err, req, res, _next) => {
  console.error('❌ Error:', err);
  const status = err.status || 500;
  const msg = err.message || 'Server error';
  res.status(status).json({ message: msg });
});

/* ------------------------------- Start app ------------------------------ */
const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await connectDB(); // Ensure Mongo connects first
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📂 Serving uploads from: ${UPLOADS_DIR}`);
      console.log(`🔗 Public uploads: http://localhost:${PORT}/api/uploads/<filename>`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    // process.exit    // process.exit(1); // uncomment if you prefer failing fast
  }
})();