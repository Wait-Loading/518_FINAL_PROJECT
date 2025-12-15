
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
const tradeOfferRoutes = require('./routes/offers'); // file provides /trade-offers endpoints
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
    origin: [
      'http://localhost:5173',
      'http://localhost:5000', 
      'https://just-plate-423503-t0.uk.r.appspot.com'
    ],
    credentials: true,
  })
);

// Only verbose logs in dev
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

/* ------------------------ Path normalization (rewrite) ------------------ */
/**
 * Normalize & rewrite common mistakes BEFORE routing:
 * - Collapse multiple slashes
 * - Fix double /api prefixes
 * - Map /auth/* to /api/auth/*
 * - Map /api/me and /auth/me to /api/auth/me
 */
app.use((req, _res, next) => {
  const original = req.url;
  let normalized = original;

  // 1) collapse multiple slashes (e.g., ///api//auth//me -> /api/auth/me)
  normalized = normalized.replace(/\/{2,}/g, '/');

  // 2) fix accidental double /api prefix
  normalized = normalized.replace(/^\/api\/api\//, '/api/');

  // 3) canonicalize delete-me aliases:
  if (normalized === '/api/me') normalized = '/api/auth/me';
  if (normalized === '/auth/me') normalized = '/api/auth/me';

  // 4) canonicalize whole /auth/ tree to /api/auth/
  if (/^\/auth\//.test(normalized)) {
    normalized = normalized.replace(/^\/auth\//, '/api/auth/');
  }

  if (normalized !== original) {
    req.url = normalized; // letting Express derive req.path
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

// (Optional convenience) mirror auth router at /auth/* in case the client hardcodes it
app.use('/auth', authRoutes);

// Listings: /api/listings, /api/listings/:id, etc.
// If your listingsRoutes is mounted at root inside the file, this mount at /api is correct.
app.use('/api', listingsRoutes);

// Trade offers: /api/trade-offers/*
app.use('/api/trade-offers', tradeOfferRoutes);

// Uploads API (multer handlers): /api/uploads/listing-images
app.use('/api/uploads', uploadsRoutes);

/* -------------------------- Static: Frontend build ---------------------- */
// IMPORTANT: ensure frontend build exists at backend/public
//   frontend: npm run build
//   copy: cp -r frontend/dist backend/public
const PUBLIC_DIR = path.join(__dirname, 'public');
app.use(express.static(PUBLIC_DIR));

/* ---------------------------- SPA Fallback ------------------------------ */
/**
 * Use a safe pattern that won't throw path-to-regexp errors and won't catch /api
 * - '/' followed by anything except starting with 'api'
 */
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

/* -------------------------- 404 & Error handlers ------------------------ */
// Only reached if not matched by any route or SPA fallback
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
// Use 8080 in Cloud (App Engine/Cloud Run); 5000 locally is fine
const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await connectDB(); // Ensure Mongo connects first
    app.listen(PORT, () => {
      console.log(`✅ MongoDB Connected`);
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📂 Serving uploads from: ${UPLOADS_DIR}`);
      console.log(`🔗 Public uploads: http://localhost:${PORT}/api/uploads/<filename>`);
      console.log(`🔐 Auth base: http://localhost:${PORT}/api/auth/* (also mirrored at /auth/*)`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
})();

// Optional: graceful shutdown
process.on('SIGINT', () => {
  console.log('🔻 Shutting down...');
  process.exit(0);
});
process.on('SIGTERM', () => {
  console.log('🔻 Shutting down...');
  process.exit(0);
});
``
