
// backend/routes/listings.js
const express = require('express');
const Listing = require('../models/Listing');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/listings?q=&category=&status=&sort=newest|oldest&owner=<userId>
 * Public search route. Optionally filter by owner (maps to userId).
 */
router.get('/listings', async (req, res, next) => {
  try {
    const { q, category, status, sort, owner } = req.query;

    const filter = {};
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
      ];
    }
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (owner) filter.userId = owner; // ✅ add owner filter to match userId

    const sortOpt = sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };

    const listings = await Listing.find(filter).sort(sortOpt).lean();
    res.json({ listings });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/listings/:id
 * Public: get one listing by id
 */
router.get('/listings/:id', async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id).lean();
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    res.json({ listing });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/users/me/listings (protected)
 * Only the current user's listings
 */
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

/**
 * GET /api/listings/my-available (protected)
 * Only the current user's listings with status 'available'
 */
router.get('/listings/my-available', auth, async (req, res, next) => {
  try {
    const listings = await Listing.find({
      userId: req.user.id,
      status: 'available'
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ listings });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/listings (protected)
 * JSON-based create; images may be an array of strings or objects (backward-compatible)
 * If you want multipart uploads in one call, add a separate /listings/upload route with Multer.
 */
router.post('/listings', auth, async (req, res, next) => {
  try {
    const { title, description, category, condition, images, location, status } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({ message: 'Title, description, and category are required' });
    }

    const listing = await Listing.create({
      userId: req.user.id,
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      condition,
      images: Array.isArray(images) ? images : [], // ✅ remains backward-compatible
      location,
      status: status || 'available',
    });

    res.status(201).json({ listing });
  } catch (err) {
        next(err);
  }
});

/**
 * PATCH /api/listings/:id (protected)
 * Update a listing. Only the owner can update.
 */
router.patch('/listings/:id', auth, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Load listing
    const listing = await Listing.findById(id);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    // Ownership check: only the creator can edit
    if (String(listing.userId) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized to update this listing' });
    }

    // Allowed fields
    const allowed = ['title', 'description', 'category', 'condition', 'location', 'status', 'images'];
    for (const key of allowed) {
      // Only apply if provided (PATCH semantics)
      if (key in req.body && req.body[key] !== undefined) {
        if (key === 'title' || key === 'description' || key === 'category') {
          listing[key] = typeof req.body[key] === 'string' ? req.body[key].trim() : req.body[key];
        } else if (key === 'images') {
          listing.images = Array.isArray(req.body.images) ? req.body.images : [];
        } else {
          listing[key] = req.body[key];
        }
      }
    }

    await listing.save();
    // Return lean JSON shape consistent with your GET
    const lean = listing.toObject();
    return res.json({ listing: lean });
  } catch (err) {
    next(err);
  }
});


router.delete('/listings/:id', auth, async (req, res, next) => {
  try {
    const { id } = req.params;

    const listing = await Listing.findById(id);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    // Ownership check
    if (String(listing.userId) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized to delete this listing' });
    }

      await listing.deleteOne();
    return res.json({ message: 'Listing deleted successfully' });
  } catch (err) {
    next(err);
  }
});



module.exports = router;
