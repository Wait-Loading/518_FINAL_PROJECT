// backend/routes/offers.js
const express = require('express');
const auth = require('../middleware/auth');
const TradeOffer = require('../models/TradeOffer');

const router = express.Router();

// -----------------------
// Create a new trade offer
// POST /api/offers
// -----------------------
router.post('/offers', auth, async (req, res, next) => {
  try {
    const { listingId, toUserId, offeredItems, message } = req.body;

    if (!listingId || !toUserId) {
      return res.status(400).json({ message: 'listingId and toUserId are required' });
    }

    const offer = await TradeOffer.create({
      listingId,
      fromUserId: req.user.id,
      toUserId,
      offeredItems: Array.isArray(offeredItems) ? offeredItems : [],
      message,
    });

    res.status(201).json({ offer });
  } catch (err) {
    next(err);
  }
});

// -----------------------
// Get all offers for a specific listing
// GET /api/listings/:id/offers
// -----------------------
router.get('/listings/:id/offers', auth, async (req, res, next) => {
  try {
    const offers = await TradeOffer.find({ listingId: req.params.id }).lean();
    res.json({ offers });
  } catch (err) {
    next(err);
  }
});

// -----------------------
// Update the status of a trade offer
// PATCH /api/offers/:id
// -----------------------
router.patch('/offers/:id', auth, async (req, res, next) => {
  try {
    const { status } = req.body;

    const offer = await TradeOffer.findById(req.params.id);
    if (!offer) return res.status(404).json({ message: 'Offer not found' });

    // Validate status
    const validStatuses = ['pending', 'accepted', 'declined', 'completed'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    if (status) offer.status = status;
    await offer.save();

    res.json({ offer });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
