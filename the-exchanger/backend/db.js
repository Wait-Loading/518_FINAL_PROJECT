const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

    if (!uri) {
      console.error("❌ MONGO_URI is NOT SET in .env");
      process.exit(1);
    }

    await mongoose.connect(uri);
    console.log('✅ MongoDB Connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
};

module.exports = connectDB;
