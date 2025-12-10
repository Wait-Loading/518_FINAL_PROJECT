
// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const tradeOfferRoutes = require('./routes/Offers');

const connectDB = require('./db'); // default export function from db.js
const authRoutes = require('./routes/auth');
const listingsRoutes = require('./routes/listings');

const app = express();

/* ----------------------------- Middleware ------------------------------ */
app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(morgan('dev'));

/* ----------------------------- Health check ---------------------------- */
app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running!', timestamp: new Date() });
});

/* -------------------------------- Routes -------------------------------- */
app.use('/api/auth', authRoutes);
app.use('/api', listingsRoutes);
app.use('/api/trade-offers', tradeOfferRoutes);

/* -------------------------- 404 & Error handlers ------------------------ */
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

/* ------------------------------- Start app ------------------------------ */
const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await connectDB(); // <- ensures Mongo is connected before listening
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
})();