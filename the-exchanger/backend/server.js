
// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const connectDB = require('./db');

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
 * Normalize & rewrite common mistakes BEFORE routing:
 * - Collapse multiple slashes
 * - Fix double /api prefixes
 * - Map /auth/* and /api/* variants to canonical paths
 * - Map /api/me or /auth/me to /api/auth/me
 */
app.use((req, _res, next) => {
  const original = req.url;
  let normalized = original;

  // 1) collapse multiple slashes (e.g., ///api//auth//me -> /api/auth/me)
  normalized = normalized.replace(/\/{2,}/g, '/');

  // 2) fix accidental double /api prefix
  normalized = normalized.replace(/^\/api\/api\//, '/api/');

  // 3) canonicalize delete-me aliases:
  //    /api/me      -> /api/auth/me
  //    /auth/me     -> /api/auth/me
  if (normalized === '/api/me') normalized = '/api/auth/me';
  if (normalized === '/auth/me') normalized = '/api/auth/me';

  // 4) canonicalize whole /auth/ tree to /api/auth/
  //    e.g., /auth/login -> /api/auth/login
  if (/^\/auth\//.test(normalized)) {
    normalized = normalized.replace(/^\/auth\//, '/api/auth/');
  }

  if (normalized !== original) {
    req.url = normalized;
    req.path = normalized.split('?')[0];
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
// Auth: canonical mount at /api/auth/*
app.use('/api/auth', authRoutes);

// (Optional convenience) also mirror auth router at /auth/* in case client hardcodes it:
app.use('/auth', authRoutes);

// Listings: /api/listings, /api/listings/:id, etc.
app.use('/api', listingsRoutes);

// Trade offers: /api/trade-offers/*
app.use('/api/trade-offers', tradeOfferRoutes);

// Uploads API (multer handlers): /api/uploads/listing-images
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
      console.log(`🔐 Auth base: http://localhost:${PORT}/api/auth/* (also mirrored at /auth/*)`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
  }
})();