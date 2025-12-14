const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String }, // ✅ Changed: NOT required (for OAuth users)
  location: String,
  phone: String,
  bio: String,
  rating: { type: Number, default: 0 },
  totalTrades: { type: Number, default: 0 },
  
  // ✅ NEW: OAuth fields
  authProvider: { 
    type: String, 
    enum: ['local', 'google', 'github'],
    default: 'local' 
  },
  providerId: { type: String },
  picture: { type: String },
  
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);