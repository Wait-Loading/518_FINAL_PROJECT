const mongoose = require('mongoose');

const tradeOfferSchema = new mongoose.Schema({
  listingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
  fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  toUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  offeredItems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Listing' }],
  message: String,
  status: { type: String, enum: ['pending', 'accepted', 'declined', 'completed'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TradeOffer', tradeOfferSchema);