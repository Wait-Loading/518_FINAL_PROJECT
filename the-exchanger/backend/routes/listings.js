// backend/routes/listings.js
const express = require('express');
const Listing = require('../models/Listing');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/listings?q=&category=&status=&sort=newest|oldest
router.get('/listings', async (req, res, next) => {
  try {
    const { q, category, status, sort } = req.query;

    const filter = {};
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
      ];
    }
    if (category) filter.category = category;
    if (status) filter.status = status;

    const sortOpt = sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };

    const listings = await Listing.find(filter).sort(sortOpt).lean();
    res.json({ listings });
  } catch (err) {
    next(err);
  }
});

// GET /api/listings/:id
router.get('/listings/:id', async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id).lean();
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    res.json({ listing });
  } catch (err) {
    next(err);
  }
});

// GET /api/users/me/listings (protected)
router.get('/users/me/listings', auth, async (req, res, next) => {
  try {
    const listings = await Listing.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ listings });
  } catch (err) {
    next(err);
  }
});

// POST /api/listings (protected)
router.post('/listings', auth, async (req, res, next) => {
  try {
    const { title, description, category, condition, images, location, status } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({ message: 'Title, description, and category are required' });
    }

    const listing = await Listing.create({
      userId: req.user.id,
      title,
      description,
      category,
      condition,
      images: Array.isArray(images) ? images : [],
      location,
      status: status || 'available',
    });

    res.status(201).json({ listing });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
