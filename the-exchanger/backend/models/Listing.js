const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  condition: String,
  images: [String],
  status: { type: String, enum: ['available', 'pending', 'traded'], default: 'available' },
  location: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Listing', listingSchema);