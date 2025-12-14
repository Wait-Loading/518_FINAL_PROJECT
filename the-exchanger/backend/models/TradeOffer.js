
const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const MessageSchema = new Schema(
  {
    senderId: { type: Types.ObjectId, ref: 'User', required: true },
    text: { type: String, trim: true, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const tradeOfferSchema = new Schema(
  {
    listingId:   { type: Types.ObjectId, ref: 'Listing', required: true }, // target listing
    fromUserId:  { type: Types.ObjectId, ref: 'User', required: true },    // proposer
    toUserId:    { type: Types.ObjectId, ref: 'User', required: true },    // listing owner

    offeredItems: [{ type: Types.ObjectId, ref: 'Listing' }],              // proposer's offered listings

    // For backward-compat: keep the original single message field.
    // New threaded messages go in `messages`.
    message: { type: String, trim: true },

    messages: [MessageSchema],

    // Offer lifecycle (keep your enum)
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'completed'],
      default: 'pending',
       },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TradeOffer', tradeOfferSchema);