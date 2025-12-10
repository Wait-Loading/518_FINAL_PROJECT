const express = require('express');
const router = express.Router();
const TradeOffer = require('../models/TradeOffer');
const auth = require('../middleware/auth');

// Create a new trade offer
router.post('/', auth, async (req, res) => {
  try {
    const offer = new TradeOffer(req.body);
    await offer.save();
    res.status(201).json({ message: 'Trade offer created', offer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get trade offers for a user
router.get('/my-offers', auth, async (req, res) => {
  try {
    const offers = await TradeOffer.find({ toUserId: req.user.id })
      .populate('listingId')
      .populate('fromUserId', 'name email');
    res.json({ offers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update offer status (accept/decline)
router.patch('/:id', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const offer = await TradeOffer.findById(req.params.id);
    if (!offer) return res.status(404).json({ message: 'Offer not found' });

    // Only recipient can update status
    if (offer.toUserId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    offer.status = status;
    await offer.save();
    res.json({ message: 'Offer updated', offer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
