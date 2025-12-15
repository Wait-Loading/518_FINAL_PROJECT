const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library'); 
const User = require('../models/User');
const auth = require('../middleware/auth');

const mongoose = require('mongoose');                 // ✅ IMPORT mongoose

const Listing = require('../models/Listing');         // ✅ IMPORT Listing
const TradeOffer = require('../models/TradeOffer');   // ✅ IMPORT TradeOffer

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID); 


if (!process.env.JWT_SECRET) {
  console.error('❌ ERROR: JWT_SECRET is NOT SET in .env');
}


/* ---------------------------------------------------------------------- */
/*  DELETE CURRENT USER (and associated Listings + TradeOffers)           */
/* ---------------------------------------------------------------------- */
async function cascadeDeleteUserData(userId, session = null) {
  const opt = session ? { session } : {};

  // 1) Delete the user's listings
  await Listing.deleteMany({ userId }, opt);

  // 2) Delete trade offers involving this user (as proposer OR recipient/owner)
  await TradeOffer.deleteMany({
    $or: [{ fromUserId: userId }, { toUserId: userId }],
  }, opt);

  // 3) Finally delete the user itself
  await User.findByIdAndDelete(userId, opt);
}

router.delete('/me', auth, async (req, res, next) => {
  const userId = req.user?.id;

  if (!userId) {
    // Defensive guard in case auth middleware misfires
    return res.status(400).json({ message: 'Missing authenticated user id' });
  }

  const session = await mongoose.startSession();
  try {
    // Try transactional delete (requires replica set)
    await session.withTransaction(async () => {
      await cascadeDeleteUserData(userId, session);
    });
    return res.status(204).send();
  } catch (txErr) {
    console.warn('⚠️ Transaction failed, falling back to non-transactional delete:', txErr.message);
    try {
      await cascadeDeleteUserData(userId, null);
      return res.status(204).send();
    } catch (err) {
      console.error('❌ Cascade delete failed:', err);
      return next(err);
    }
  } finally {
    session.endSession();
  }
});


async function cascadeDeleteUserData(userId, session = null) {
  const opt = session ? { session } : {};

  // 1) Delete the user's listings
  await Listing.deleteMany({ userId }, opt);

  // 2) Delete trade offers involving this user (as proposer OR recipient/owner)
  await TradeOffer.deleteMany({
    $or: [{ fromUserId: userId }, { toUserId: userId }]
  }, opt);

  // 3) Finally delete the user itself
  await User.findByIdAndDelete(userId, opt);
}



// REGISTER
// REGISTER
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, location } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      location,
      authProvider: 'local' // ✅ ADD THIS LINE
    });

    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        location: user.location || null,
        picture: user.picture || null, // ✅ ADD THIS LINE
      },
    });
  } catch (error) {
    console.error('REGISTER ERROR:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// LOGIN
// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // ✅ ADD THIS CHECK (prevents OAuth users from using email/password)
    if (user.authProvider !== 'local') {
      return res.status(400).json({ 
        message: `Please login with ${user.authProvider}` 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        location: user.location || null,
        picture: user.picture || null, // ✅ ADD THIS LINE
      },
    });
  } catch (error) {
    console.error('LOGIN ERROR:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
// ✅ ADD THIS ENTIRE NEW ROUTE
// GOOGLE OAUTH LOGIN
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: 'No credential provided' });
    }

    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: providerId, email, name, picture } = payload;

    // Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      // User exists - check if they registered with email/password
      if (user.authProvider === 'local') {
        return res.status(400).json({ 
          message: 'Email already registered. Please login with password.' 
        });
      }

      // Update profile picture if changed
      if (user.picture !== picture) {
        user.picture = picture;
        await user.save();
      }
    } else {
      // Create new user
      user = new User({
        name,
        email,
        authProvider: 'google',
        providerId,
        picture,
      });
      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        location: user.location || null,
        picture: user.picture || null,
      },
    });
  } catch (error) {
    console.error('GOOGLE AUTH ERROR:', error);
    res.status(500).json({ 
      message: 'Google authentication failed', 
      error: error.message 
    });
  }
});
// GET CURRENT USER
router.get('/me', auth, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      location: req.user.location || null,
      picture: req.user.picture || null,
    }
  });
});

module.exports = router;
