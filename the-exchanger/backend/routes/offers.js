
const express = require('express');
const { Types } = require('mongoose');
const auth = require('../middleware/auth');
const TradeOffer = require('../models/TradeOffer');
const Listing = require('../models/Listing');

const router = express.Router();

/* ----------------------------- Helpers ----------------------------- */

const isObjectId = (id) => {
  try { return Types.ObjectId.isValid(id); } catch { return false; }
};

const ensureParticipant = (offer, userId) => {
  const uid = String(userId);
  return String(offer.fromUserId) === uid || String(offer.toUserId) === uid;
};

const ensureOwner = (offer, userId) => String(offer.toUserId) === String(userId);

/* -------------------- Create an offer + first message -------------------- */
/**
 * POST /api/trade-offers
 * Body: { listingId, offeredItems?: ObjectId[], message?: string }
 *
 * - Derives toUserId from Listing.userId (no need to pass toUserId from client).
 * - Validates offered items belong to proposer and are 'available'.
 * - Stores first message in messages[]; keeps legacy "message" too.
 */
router.post('/', auth, async (req, res, next) => {
  try {
    const { listingId, offeredItems = [], message = '' } = req.body;

    if (!listingId) {
      return res.status(400).json({ message: 'listingId is required' });
    }

    // Load target listing to get owner
    const listing = await Listing.findById(listingId).lean();
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    const proposerId = req.user.id;
    const ownerId = String(listing.userId);

    if (ownerId === String(proposerId)) {
      return res.status(400).json({ message: 'You cannot make an offer on your own listing' });
    }

    // Validate offered items: must belong to proposer and be 'available'
    const cleanIds = offeredItems.filter(isObjectId);
    const validOffered = await Listing.find({
      _id: { $in: cleanIds },
      userId: proposerId,
      status: 'available',
    }).lean();

    const offer = await TradeOffer.create({
      listingId: listing._id,
      fromUserId: proposerId,
      toUserId: ownerId,
      offeredItems: validOffered.map((l) => l._id),
      message: message?.trim() || undefined,
      messages: message?.trim() ? [{ senderId: proposerId, text: message.trim() }] : [],
      status: 'pending',
    });

    res.status(201).json({ offer });
  } catch (err) {
    next(err);
  }
});

/* --------------------- Get offers for a specific listing ------------------ */
/**
 * GET /api/trade-offers/listing/:id
 * - Only the listing owner can see all offers for their listing.
 */
router.get('/listing/:id', auth, async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id).lean();
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    if (String(listing.userId) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized to view offers for this listing' });
    }

    const offers = await TradeOffer.find({ listingId: listing._id })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ offers });
  } catch (err) {
    next(err);
  }
});

/* -------------------------- Get offers I made ---------------------------- */
/**
 * GET /api/trade-offers/mine
 * - Proposer sees offers they created.
 * - Optional query ?listingId=<id> to filter by a listing thread.
 */
router.get('/mine', auth, async (req, res, next) => {
  try {
    const filter = { fromUserId: req.user.id };
    if (req.query.listingId && isObjectId(req.query.listingId)) {
      filter.listingId = req.query.listingId;
    }

    const offers = await TradeOffer.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    res.json({ offers });
  } catch (err) {
    next(err);
  }
});

/* ------------------------ Get one offer (thread) ------------------------- */
/**
 * GET /api/trade-offers/:id
 * - Only participants can view.
 */
router.get('/:id', auth, async (req, res, next) => {
  try {
    const offer = await TradeOffer.findById(req.params.id).lean();
    if (!offer) return res.status(404).json({ message: 'Offer not found' });

    if (!ensureParticipant(offer, req.user.id)) {
      return res.status(403).json({ message: 'Not authorized to view this offer' });
    }

    res.json({ offer });
  } catch (err) {
    next(err);
  }
});

/* ---------------------- Update offered items (proposer) ------------------ */
/**
 * PATCH /api/trade-offers/:id/offered-items
 * Body: { offeredItems: ObjectId[] }
 * - Only proposer, only while status === 'pending'
 */
router.patch('/:id/offered-items', auth, async (req, res, next) => {
  try {
    const offer = await TradeOffer.findById(req.params.id);
    if (!offer) return res.status(404).json({ message: 'Offer not found' });

    if (String(offer.fromUserId) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Only proposer can update offered items' });
    }
    if (offer.status !== 'pending') {
      return res.status(400).json({ message: 'Cannot update after offer is accepted or closed' });
    }

    const ids = Array.isArray(req.body.offeredItems) ? req.body.offeredItems : [];
    const cleanIds = ids.filter(isObjectId);

    // Validate ownership + availability
    const validOffered = await Listing.find({
      _id: { $in: cleanIds },
      userId: req.user.id,
      status: 'available',
    }).lean();

    offer.offeredItems = validOffered.map((l) => l._id);
    await offer.save();

    res.json({ offer });
  } catch (err) {
    next(err);
  }
});

/* --------------------------- Post a chat message ------------------------- */
/**
 * POST /api/trade-offers/:id/messages
 * Body: { text }
 * - Only participants can post.
 */
router.post('/:id/messages', auth, async (req, res, next) => {
  try {
    const offer = await TradeOffer.findById(req.params.id);
    if (!offer) return res.status(404).json({ message: 'Offer not found' });

    if (!ensureParticipant(offer, req.user.id)) {
      return res.status(403).json({ message: 'Not authorized to post in this thread' });
    }

    const text = (req.body.text || '').trim();
    if (!text) return res.status(400).json({ message: 'Message text is required' });

    // Ensure messages array exists even if old offers only had "message" field
    if (!Array.isArray(offer.messages)) offer.messages = [];

    offer.messages.push({ senderId: req.user.id, text });
    await offer.save();

    res.status(201).json({ offer });
  } catch (err) {
    next(err);
  }
});

/* ------------------------------- Accept ---------------------------------- */
/**
 * POST /api/trade-offers/:id/accept
 * - Only listing owner.
 * - Sets offer.status='accepted'.
 * - Sets listing + offered items to 'pending'.
 * - Auto-declines other pending offers on the same listing.
 */
router.post('/:id/accept', auth, async (req, res, next) => {
  try {
    const offer = await TradeOffer.findById(req.params.id);
    if (!offer) return res.status(404).json({ message: 'Offer not found' });

    if (!ensureOwner(offer, req.user.id)) {
      return res.status(403).json({ message: 'Only listing owner can accept the offer' });
    }
    if (offer.status !== 'pending') {
      return res.status(400).json({ message: `Offer is already ${offer.status}` });
    }

    // Set involved listings to pending
    await Listing.updateOne({ _id: offer.listingId }, { $set: { status: 'pending' } });
    if (offer.offeredItems.length > 0) {
      await Listing.updateMany(
        { _id: { $in: offer.offeredItems } },
        { $set: { status: 'pending' } }
      );
    }

    offer.status = 'accepted';
    await offer.save();

    // Auto-decline other pending offers for the same listing
    await TradeOffer.updateMany(
      { listingId: offer.listingId, _id: { $ne: offer._id }, status: 'pending' },
      { $set: { status: 'declined' } }
    );

    res.json({ offer });
  } catch (err) {
    next(err);
  }
});

/* ------------------------------- Decline --------------------------------- */
/**
 * POST /api/trade-offers/:id/decline
 * - Only listing owner.
 */
router.post('/:id/decline', auth, async (req, res, next) => {
  try {
    const offer = await TradeOffer.findById(req.params.id);
    if (!offer) return res.status(404).json({ message: 'Offer not found' });

    if (!ensureOwner(offer, req.user.id)) {
      return res.status(403).json({ message: 'Only listing owner can decline the offer' });
    }
    if (['declined', 'completed'].includes(offer.status)) {
      return res.status(400).json({ message: `Offer is already ${offer.status}` });
    }

    offer.status = 'declined';
    await offer.save();

    res.json({ offer });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', auth, async (req, res, next) => {
  try {
    const offer = await TradeOffer.findById(req.params.id)
      .populate({
        path: 'offeredItems',
        select: 'title images status description userId', // select what you want to show
      })
      .lean();

    if (!offer) return res.status(404).json({ message: 'Offer not found' });

    if (!ensureParticipant(offer, req.user.id)) {
      return res.status(403).json({ message: 'Not authorized to view this offer' });
    }

       res.json({ offer });
  } catch (err) {
    next(err);
  }
});

/* ------------------------------- Mark ------------------------------------ */
/**
 * POST /api/trade-offers/:id/mark
 * Body: { status: 'completed' | 'pending' | 'available' }
 * - Only listing owner.
 * - completed: set involved listings to 'traded', offer.status='completed'
 * - pending:   set involved listings to 'pending'
 * - available: revert involved listings to 'available', offer.status='declined'
 */
router.post('/:id/mark', auth, async (req, res, next) => {
  try {
    const offer = await TradeOffer.findById(req.params.id);
    if (!offer) return res.status(404).json({ message: 'Offer not found' });

    if (!ensureOwner(offer, req.user.id)) {
      return res.status(403).json({ message: 'Only listing owner can mark trade outcome' });
    }

    const status = (req.body.status || '').trim();
    if (!['completed', 'pending', 'available'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    if (status === 'completed') {
      await Listing.updateOne({ _id: offer.listingId }, { $set: { status: 'traded' } });
      if (offer.offeredItems.length > 0) {
        await Listing.updateMany(
          { _id: { $in: offer.offeredItems } },
          { $set: { status: 'traded' } }
        );
      }
      offer.status = 'completed';
      await offer.save();
    } else if (status === 'pending') {
      await Listing.updateOne({ _id: offer.listingId }, { $set: { status: 'pending' } });
      if (offer.offeredItems.length > 0) {
        await Listing.updateMany(
          { _id: { $in: offer.offeredItems } },
          { $set: { status: 'pending' } }
        );
      }
      // Keep current offer status unless it's closed
      if (offer.status === 'declined') {
        offer.status = 'pending';
      }
      await offer.save();
    } else if (status === 'available') {
      await Listing.updateOne({ _id: offer.listingId }, { $set: { status: 'available' } });
      if (offer.offeredItems.length > 0) {
        await Listing.updateMany(
          { _id: { $in: offer.offeredItems } },
          { $set: { status: 'available' } }
        );
      }
      offer.status = 'declined';
      await offer.save();
    }

    res.json({ offer });
  } catch (err) {
    next(err);
  }
});


router.get('/:id', auth, async (req, res, next) => {router.get
  try {
    const offer = await TradeOffer.findById(req.params.id)
      .populate({
        path: 'offeredItems',
        select: 'title images status description userId', // fields to display
      })
      .lean();

    if (!offer) return res.status(404).json({ message: 'Offer not found' });

    const isParticipant =
      String(offer.fromUserId) === String(req.user.id) ||
      String(offer.toUserId) === String(req.user.id);
    if (!isParticipant) {
      return res.status(403).json({ message: 'Not authorized to view this offer' });
    }

    res.json({ offer });
  } catch (err) {
    next(err);
  }
});
module.exports = router;