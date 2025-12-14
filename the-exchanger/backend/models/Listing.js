
// models/Listing.js
const mongoose = require('mongoose');

const ImageObjectSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },       // e.g., "/uploads/abc.jpg" or full CDN URL
    filename: { type: String },                  // stored filename
    mimetype: { type: String },                  // e.g., "image/png"
    size: { type: Number },                      // bytes
    uploadedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const listingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  condition: String,

  /**
   * Backward-compatible images field:
   * - Accepts legacy strings (e.g., ["https://..."]) or
   * - New image objects (ImageObjectSchema)
   * Using Mixed allows either type in the array.
   */
  images: {
    type: [mongoose.Schema.Types.Mixed], // can be String or ImageObjectSchema-like object
    default: []                          // optional: can be empty; old documents unaffected
  },

  status: {
    type: String,
    enum: ['available', 'pending', 'traded'],
    default: 'available'
  },
  location: String,
  createdAt: { type: Date, default: Date.now }
});

/**
 * Helper: returns normalized array of URLs for easy UI consumption
 * - If item is a string, returns it as-is.
 * - If item is an object with { url }, returns url.
 */
listingSchema.methods.getImageUrls = function () {
  return (this.images || [])
    .map(img => (typeof img === 'string' ? img : img?.url))
    .filter(Boolean);
};

/**
 * Helper: returns a normalized array of rich image objects
 * - Converts string entries into { url: <string> } objects
 */
listingSchema.methods.getImageObjects = function () {
  return (this.images || []).map(img => {
       if (typeof img === 'string') {
      return { url: img };
    }
    return img;
  });
};

module.exports = mongoose.model('Listing', listingSchema);